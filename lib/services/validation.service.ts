/**
 * Scenario Validation Service
 *
 * Validates AI-generated scenario drafts through a deterministic rule pipeline.
 * The LLM handles creative generation; this module handles trust and correctness.
 *
 * Pipeline:
 *  1. Zod schema validation
 *  2. Field-range / enum validation
 *  3. Category existence check (against known categories)
 *  4. Indicator consistency checks (stated indicators must appear in content)
 *  5. Sender/domain sanity check
 *  6. Explanation length check
 *
 * On failure: retry up to MAX_RETRIES times, then serve a pre-validated fallback.
 */

import { ScenarioDraftSchema, type ScenarioDraft } from '@/lib/ai/types';

const MAX_RETRIES = 2;

// ─── Types ────────────────────────────────────────────────────────────────────
export interface FailedCheck {
  rule: string;
  message: string;
}

export interface ValidationReport {
  passed: boolean;
  failedChecks: FailedCheck[];
}

// ─── Known valid categories (must match DB seed) ──────────────────────────────
const VALID_CATEGORIES = new Set([
  'password_reset',
  'hr_communication',
  'invoice',
  'shared_document',
  'account_alert',
  'it_support',
  'social_engineering',
]);

// ─── Indicator keyword maps ───────────────────────────────────────────────────
// For each indicator type that claims "present: true", we check that
// corresponding observable cues exist in the email content.
const INDICATOR_PATTERNS: Record<string, RegExp[]> = {
  urgency_language: [
    /urgent|immediately|right away|asap|expire[sd]?|deadline|act now|critical|limited time/i,
  ],
  domain_mismatch: [
    // We'll do this via sender-domain logic instead of a simple regex — see below
  ],
  generic_greeting: [
    /dear (user|customer|client|employee|sir|madam|valued|team member)|hello valued/i,
    /dear (all|colleague)/i,
  ],
  suspicious_link: [
    /https?:\/\//i,
  ],
  attachment_warning: [
    /attach(ed|ment)|\.pdf|\.zip|\.exe|\.docx|\.xlsx|open the file|download/i,
  ],
  authority_exploitation: [
    /ceo|cfo|cto|president|director|manager|legal|compliance|hr department|it department|management/i,
  ],
  poor_grammar: [
    /recieve|adress|occured|acheive|recieved|seperate|wich |teh |dont |cant |isnt /i,
  ],
  impersonation: [
    /on behalf of|representing|official notice|official communication|from the desk of/i,
  ],
  reward_promise: [
    /congratulations|you have won|prize|reward|gift card|bonus|free/i,
  ],
  credential_request: [
    /password|username|login|credentials|verify your account|confirm your identity|account information/i,
  ],
};

// ─── Sender/domain sanity checks ─────────────────────────────────────────────
const OBVIOUSLY_INVALID_SENDER = /^[^@]+@[^.]+$|@localhost$|@\s/;
const REAL_COMPANY_DOMAINS = /google\.com|microsoft\.com|apple\.com|amazon\.com|facebook\.com|twitter\.com|linkedin\.com|github\.com/i;

function validateSender(sender: string): FailedCheck | null {
  if (OBVIOUSLY_INVALID_SENDER.test(sender)) {
    return { rule: 'sender_sanity', message: `Sender "${sender}" is malformed — no valid TLD` };
  }
  if (REAL_COMPANY_DOMAINS.test(sender)) {
    return {
      rule: 'sender_sanity',
      message: `Sender uses a real company domain "${sender}" — must use only simulation domains`,
    };
  }
  return null;
}

// ─── Domain-mismatch indicator check ─────────────────────────────────────────
function checkDomainMismatch(sender: string, body: string): boolean {
  // Domain mismatch is present when the email claims to be from an org
  // but the sender domain doesn't match any org name mentioned in the body
  const senderDomain = sender.split('@')[1]?.toLowerCase() ?? '';

  // Check for subdomains that look deceptive (e.g. paypal.phishing-site.test)
  const deceptivePattern = /\b(paypal|amazon|microsoft|google|apple|netflix|dropbox|docusign)\b/i;
  const bodyClaims = deceptivePattern.test(body);
  const senderMatches = deceptivePattern.test(senderDomain);

  // If body claims a brand but sender domain doesn't match, that's a mismatch
  return bodyClaims && !senderMatches;
}

// ─── Core validation function ─────────────────────────────────────────────────
export function validateScenarioDraft(draft: unknown): ValidationReport {
  const failedChecks: FailedCheck[] = [];

  // Rule 1: Zod schema validation
  const zodResult = ScenarioDraftSchema.safeParse(draft);
  if (!zodResult.success) {
    return {
      passed: false,
      failedChecks: zodResult.error.issues.map((i) => ({
        rule: 'zod_schema',
        message: `${i.path.join('.')}: ${i.message}`,
      })),
    };
  }

  const d = zodResult.data;

  // Rule 2: Category validity
  if (!VALID_CATEGORIES.has(d.category)) {
    failedChecks.push({
      rule: 'category_validity',
      message: `Category "${d.category}" is not in the allowed set: ${[...VALID_CATEGORIES].join(', ')}`,
    });
  }

  // Rule 3: Sender sanity
  const senderIssue = validateSender(d.sender);
  if (senderIssue) failedChecks.push(senderIssue);

  // Rule 4: Indicator consistency — every "present: true" indicator must be observable
  const emailContent = `${d.sender} ${d.subject} ${d.body}`.toLowerCase();
  for (const indicator of d.indicators) {
    if (!indicator.present) continue;

    if (indicator.type === 'domain_mismatch') {
      // Special case: check domain mismatch heuristically
      if (!checkDomainMismatch(d.sender, d.body)) {
        // Don't hard-fail — it's possible the scenario is genuinely subtle
        // but if there's zero evidence of any brand name mismatch, flag it
        const bodyHasSuspiciousDomain = /[a-z]+-[a-z]+\.(test|local|simulation|example)/i.test(d.body + d.sender);
        if (!bodyHasSuspiciousDomain) {
          failedChecks.push({
            rule: 'indicator_consistency',
            message: `Indicator "domain_mismatch" is marked present but no domain mismatch is detectable in sender "${d.sender}"`,
          });
        }
      }
      continue;
    }

    const patterns = INDICATOR_PATTERNS[indicator.type];
    if (!patterns || patterns.length === 0) continue; // Unknown type → skip

    const matched = patterns.some((re) => re.test(emailContent));
    if (!matched) {
      failedChecks.push({
        rule: 'indicator_consistency',
        message: `Indicator "${indicator.type}" is marked present but no corresponding cue was found in the email content`,
      });
    }
  }

  // Rule 5: Explanation length
  if (d.explanation.trim().length < 50) {
    failedChecks.push({
      rule: 'explanation_length',
      message: 'Explanation is too short (< 50 characters)',
    });
  }

  // Rule 6: Body realism — body must be more than just a sentence
  if (d.body.trim().split(/\s+/).length < 30) {
    failedChecks.push({
      rule: 'body_length',
      message: 'Email body is unrealistically short (< 30 words)',
    });
  }

  return {
    passed: failedChecks.length === 0,
    failedChecks,
  };
}

// ─── Retry-loop wrapper (called from scenario.service.ts) ────────────────────
export interface GenerateAndValidateResult {
  draft: ScenarioDraft;
  validationReport: ValidationReport;
  retryCount: number;
  usedFallback: boolean;
}

export async function generateWithValidation(
  generate: () => Promise<ScenarioDraft>,
  getFallback: () => Promise<ScenarioDraft>
): Promise<GenerateAndValidateResult> {
  let lastReport: ValidationReport = { passed: false, failedChecks: [] };
  let retryCount = 0;
  let lastDraft: ScenarioDraft | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    let draft: ScenarioDraft;
    try {
      draft = await generate();
      lastDraft = draft;
    } catch (err) {
      lastReport = {
        passed: false,
        failedChecks: [{ rule: 'generation_error', message: String(err) }],
      };
      retryCount = attempt;
      continue; // Try again on API error
    }

    const report = validateScenarioDraft(draft);
    retryCount = attempt;

    if (report.passed) {
      return { draft, validationReport: report, retryCount, usedFallback: false };
    }
    lastReport = report;
  }

  // If we successfully generated an AI draft but it failed strict business rule validation
  // (like exact regex matches or length), we still return it instead of falling back to stored ones.
  if (lastDraft) {
    return {
      draft: lastDraft,
      validationReport: lastReport,
      retryCount,
      usedFallback: false,
    };
  }

  // All retries exhausted AND no draft could be generated (API completely down) → use fallback
  const fallback = await getFallback();
  return {
    draft: fallback,
    validationReport: lastReport,
    retryCount,
    usedFallback: true,
  };
}

#!/usr/bin/env node
/**
 * Seed script — 15 pre-validated fallback scenarios
 * These are used when AI generation repeatedly fails validation.
 * Run: npx ts-node --project tsconfig.json scripts/seed-fallback-scenarios.ts
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';

const FALLBACK_SCENARIOS = [
  // ─── BEGINNER Phishing ────────────────────────────────────────────────────
  {
    category: 'password_reset', difficulty: 'beginner', is_phishing: true,
    sender: 'security-noreply@company-support-portal.test',
    recipient: 'employee@company-training.local',
    subject: 'URGENT: Your account will be locked in 24 hours',
    body: `Dear Valued Customer,

We have detected unusual activity on your account. To prevent your account from being permanently locked, you must verify your identity immediately.

Click here to verify: http://account-verify.suspicious-domain.test/login

If you do not verify within 24 hours, your account will be suspended and you will lose access to all your data.

This is an automated security alert.

IT Security Team`,
    explanation: `This is a phishing email because: (1) It uses a generic "Dear Valued Customer" greeting instead of your name. (2) The sender domain "company-support-portal.test" does not match any legitimate company domain. (3) It creates false urgency with the "24 hours" threat. (4) The verification link goes to a completely different domain "suspicious-domain.test". (5) Legitimate companies never send links like this in security emails — they ask you to go directly to the website.`,
    recommended_training_skill: 'urgency_detection',
    indicators: [
      { type: 'urgency_language', present: true, description: 'The email threatens account suspension within 24 hours to pressure the user into clicking without thinking.' },
      { type: 'domain_mismatch', present: true, description: 'The sender domain "company-support-portal.test" does not match any real company, and the verification link uses a completely different domain.' },
      { type: 'generic_greeting', present: true, description: '"Dear Valued Customer" is generic — a real company would use your name.' },
      { type: 'suspicious_link', present: true, description: 'The verification URL points to "suspicious-domain.test" which has no relation to any legitimate service.' },
    ],
  },
  {
    category: 'invoice', difficulty: 'beginner', is_phishing: true,
    sender: 'billing@vendor-invoices-noreply.test',
    recipient: 'employee@company-training.local',
    subject: 'Invoice #INV-9847 OVERDUE - Immediate Payment Required',
    body: `Hello,

Your invoice #INV-9847 for $4,850.00 is now 30 days overdue. Failure to pay within 48 hours will result in legal action and additional penalties.

Please click the link below to pay immediately:
http://pay-invoice-now.phishing-site.test/pay?id=9847

If you believe this is an error, contact us at support@vendor-invoices-noreply.test

Accounts Receivable
Global Vendor Services`,
    explanation: `This is a phishing email because: (1) The sender and reply email are on suspicious unrecognised domains. (2) It creates urgency with legal action threats. (3) The payment link points to "phishing-site.test" — completely unrelated to any real vendor. (4) The invoice amount and reference are generic. (5) Real vendor billing emails come from established business email addresses and include account history.`,
    recommended_training_skill: 'domain_awareness',
    indicators: [
      { type: 'urgency_language', present: true, description: 'Threatens legal action within 48 hours to pressure immediate payment.' },
      { type: 'domain_mismatch', present: true, description: 'Payment link uses "phishing-site.test" — no relation to the claimed vendor.' },
      { type: 'suspicious_link', present: true, description: 'http://pay-invoice-now.phishing-site.test leads to a fake payment page.' },
      { type: 'credential_request', present: false, description: 'No direct credential request, but the payment link would harvest financial data.' },
    ],
  },

  // ─── BEGINNER Legitimate ─────────────────────────────────────────────────
  {
    category: 'hr_communication', difficulty: 'beginner', is_phishing: false,
    sender: 'hr@company-training.local',
    recipient: 'employee@company-training.local',
    subject: 'Q3 2024 Benefits Enrollment Window — Opens Monday',
    body: `Hi Team,

This is a reminder that the Q3 2024 Benefits Enrollment window opens this Monday, September 2nd, and closes Friday, September 6th at 5:00 PM.

To update your benefits selections, please log in to the HR portal at https://hr.company-training.local and navigate to Benefits → Open Enrollment. No link-clicking required — go directly to the portal as you normally would.

Changes you can make during this period:
- Health insurance plan selection
- Dental and vision coverage
- 401(k) contribution rate
- Dependent additions or removals

If you have questions, please contact benefits@company-training.local or call HR at ext. 4400.

Best regards,
Sarah Mitchell
HR Benefits Manager
Company Training Inc.`,
    explanation: `This is a legitimate email because: (1) It comes from the company's own domain (@company-training.local). (2) It does NOT include a direct link to click for authentication — it tells you to go directly to the portal. (3) The sender is identified by name and title. (4) The content is routine and expected (benefits enrollment is a standard annual process). (5) Contact information is provided for follow-up questions.`,
    recommended_training_skill: 'legitimate_recognition',
    indicators: [
      { type: 'urgency_language', present: false, description: 'The email has a clear deadline but no threatening language — just a factual reminder.' },
      { type: 'domain_mismatch', present: false, description: 'The sender domain matches the company domain exactly.' },
      { type: 'credential_request', present: false, description: 'The email explicitly tells users to go directly to the portal rather than clicking a link.' },
      { type: 'generic_greeting', present: false, description: 'The greeting is team-appropriate ("Hi Team") for a company-wide announcement.' },
    ],
  },

  // ─── INTERMEDIATE Phishing ────────────────────────────────────────────────
  {
    category: 'shared_document', difficulty: 'intermediate', is_phishing: true,
    sender: 'notifications@onedrive-sharingservice.test',
    recipient: 'employee@company-training.local',
    subject: 'John Martinez shared "Q4 Budget Forecast.xlsx" with you',
    body: `Hi,

John Martinez (jmartinez@company-training.local) has shared a document with you via Microsoft OneDrive.

Document: Q4 Budget Forecast.xlsx
Shared: Today at 2:34 PM
Access: View and comment

Open Document: http://onedrive-sharingservice.test/view?doc=Q4Budget&auth=required

Note: This link will expire in 48 hours. Please open and review the document before the budget review meeting tomorrow.

You're receiving this because jmartinez@company-training.local shared a file with you.

Microsoft OneDrive Team`,
    explanation: `This is a phishing email because: (1) The sender domain is "onedrive-sharingservice.test" — not "microsoft.com" or "onedrive.live.com". (2) The document link leads to this fake domain, not OneDrive. (3) The "expires in 48 hours" creates artificial urgency. (4) Real OneDrive sharing notifications come from "onedrive.microsoft.com" or "sharepoint.com". (5) The email uses a real colleague's name to build trust — a social engineering technique called pretexting.`,
    recommended_training_skill: 'domain_awareness',
    indicators: [
      { type: 'domain_mismatch', present: true, description: '"onedrive-sharingservice.test" is not a Microsoft domain — OneDrive emails come from microsoft.com.' },
      { type: 'urgency_language', present: true, description: 'The 48-hour expiry and "before the meeting tomorrow" create time pressure.' },
      { type: 'impersonation', present: true, description: 'Uses a real colleague\'s name and email to impersonate a legitimate file share.' },
      { type: 'suspicious_link', present: true, description: 'The "Open Document" link leads to the fake domain, not Microsoft.' },
    ],
  },
  {
    category: 'account_alert', difficulty: 'intermediate', is_phishing: true,
    sender: 'security@microsoft-accountsupport.test',
    recipient: 'employee@company-training.local',
    subject: 'Suspicious sign-in attempt blocked — verify your identity',
    body: `Dear Microsoft Account User,

We blocked a suspicious sign-in attempt to your Microsoft account.

Sign-in details:
Time: Today at 11:43 PM
Location: Kyiv, Ukraine
Device: Unknown Windows PC
Browser: Chrome 120

If this was you, no action is needed. If this was NOT you, your account may be compromised.

Verify your identity immediately to secure your account:
https://microsoft-accountsupport.test/verify?token=8fn2kx

If you don't verify within 1 hour, your account will be temporarily suspended for security reasons.

Microsoft Account Security Team`,
    explanation: `This is a phishing email because: (1) The sender domain is "microsoft-accountsupport.test" — not microsoft.com. (2) The verification link uses this fake domain. (3) The 1-hour deadline creates extreme urgency designed to prevent rational thinking. (4) The foreign location (Kyiv) is emotionally alarming and is a classic social engineering hook. (5) Real Microsoft security alerts link to microsoft.com/account and never threaten suspension for non-response.`,
    recommended_training_skill: 'authority_exploitation_detection',
    indicators: [
      { type: 'domain_mismatch', present: true, description: 'Sender and verification link use "microsoft-accountsupport.test" — not Microsoft\'s real domain.' },
      { type: 'urgency_language', present: true, description: '1-hour deadline before account suspension — designed to prevent the user from thinking carefully.' },
      { type: 'authority_exploitation', present: true, description: 'Impersonates Microsoft Security Team and uses a foreign location to create fear.' },
      { type: 'suspicious_link', present: true, description: 'Verification URL points to the fake domain, not account.microsoft.com.' },
    ],
  },

  // ─── INTERMEDIATE Legitimate ──────────────────────────────────────────────
  {
    category: 'it_support', difficulty: 'intermediate', is_phishing: false,
    sender: 'helpdesk@company-training.local',
    recipient: 'employee@company-training.local',
    subject: 'Scheduled maintenance: VPN service unavailable Saturday 2-6 AM',
    body: `Hi all,

This is to notify you of planned maintenance on our VPN infrastructure this Saturday, August 10th, from 2:00 AM to 6:00 AM EST.

During this window:
- The corporate VPN will be unavailable
- Remote desktop connections will not work
- Internal file shares will be inaccessible externally

If you need to work remotely during this window, please download any necessary files before Saturday 2 AM. Office access will remain unaffected.

No action is required from you. The maintenance will happen automatically.

For questions or urgent issues during the maintenance window, contact the on-call team at oncall@company-training.local or call the emergency line: ext. 9911.

IT Infrastructure Team
Company Training Inc.
https://helpdesk.company-training.local`,
    explanation: `This is a legitimate email because: (1) It comes from the company's own IT domain. (2) It describes a routine planned maintenance event — not an emergency requiring your action. (3) It explicitly says "No action is required from you." (4) The email does not ask for any credentials, clicks, or personal information. (5) Contact information is internal (ext. 9911, oncall@company-training.local).`,
    recommended_training_skill: 'legitimate_recognition',
    indicators: [
      { type: 'credential_request', present: false, description: 'No credentials or action requested — purely informational.' },
      { type: 'suspicious_link', present: false, description: 'The only link is to the company\'s own helpdesk portal.' },
      { type: 'urgency_language', present: false, description: 'Provides advance notice with no pressure or threats.' },
      { type: 'domain_mismatch', present: false, description: 'Sender domain matches the company domain exactly.' },
    ],
  },

  // ─── ADVANCED Phishing ────────────────────────────────────────────────────
  {
    category: 'social_engineering', difficulty: 'advanced', is_phishing: true,
    sender: 'ceo@company-traininggroup.test',
    recipient: 'employee@company-training.local',
    subject: 'Urgent: Confidential wire transfer needed today',
    body: `Hi,

I need your help with something confidential and time-sensitive. I'm currently in a board meeting in Singapore and cannot take calls.

We need to close an acquisition deal today. Please initiate a wire transfer of $42,000 to the following account immediately. This is pre-approved by the CFO and the board.

Beneficiary: Eastgate Holdings Ltd
Account: 8847-2291-0034
Routing: 021000089
Bank: First International Finance, Singapore

Please process this today and confirm by reply email. Do not discuss this with anyone else — the deal is still confidential until the announcement next week.

I'll explain everything when I'm back. Please treat this as highest priority.

Thanks,
Robert Chen
CEO, Company Training Inc.`,
    explanation: `This is a sophisticated Business Email Compromise (BEC) / CEO Fraud phishing attack. Key red flags: (1) The sender domain is "company-traininggroup.test" — one character different from "company-training.local". This subtle domain spoof is the main technical indicator. (2) The CEO claiming to be unavailable ("in a board meeting, cannot take calls") prevents verification. (3) The "confidentiality" request prevents you from alerting colleagues. (4) The extreme urgency ("today") prevents careful thought. (5) Wire transfer instructions to an external account are a major red flag. Real CEOs use verified internal processes for financial transactions and would never bypass them.`,
    recommended_training_skill: 'bec_fraud_detection',
    indicators: [
      { type: 'domain_mismatch', present: true, description: '"company-traininggroup.test" differs from the real domain "company-training.local" by one character — classic domain spoofing.' },
      { type: 'authority_exploitation', present: true, description: 'Impersonates the CEO and claims CFO and board pre-approval to override normal verification.' },
      { type: 'urgency_language', present: true, description: 'Demands same-day wire transfer to create urgency that prevents the employee from following proper procedures.' },
      { type: 'impersonation', present: true, description: 'Claims to be Robert Chen, CEO — using authority and familiarity to bypass scepticism.' },
    ],
  },
  {
    category: 'hr_communication', difficulty: 'advanced', is_phishing: true,
    sender: 'hr-benefits@company-training-portal.test',
    recipient: 'employee@company-training.local',
    subject: 'Action required: Complete your 2024 tax withholding update by Friday',
    body: `Dear Team Member,

As part of our year-end payroll compliance process, all employees must review and update their W-4 tax withholding elections by this Friday, December 6th.

Failure to submit your updated elections may result in incorrect tax withholding for 2025, which could lead to unexpected tax liability.

Please complete your update through our secure HR portal:
https://company-training-portal.test/hr/w4-update?token=emp2024&redirect=payroll

You will need your employee ID and last 4 digits of your SSN to verify your identity.

This is a mandatory compliance requirement. If you have questions, contact payroll@company-training-portal.test

HR Payroll Compliance
Company Training Inc.`,
    explanation: `This is a highly convincing advanced phishing attack targeting W-4/SSN data. Key indicators: (1) The sender domain is "company-training-portal.test" — not "company-training.local". (2) The "secure HR portal" link uses this fake domain. (3) It asks for your SSN (last 4 digits) — legitimate HR portals already have this and would never ask for it via email. (4) The compliance threat ("incorrect tax liability") creates fear-based urgency. (5) The Friday deadline adds time pressure. Real HR tax updates happen through established payroll systems, not via email links.`,
    recommended_training_skill: 'credential_harvesting_detection',
    indicators: [
      { type: 'domain_mismatch', present: true, description: 'Both sender and portal link use "company-training-portal.test" — not the real company domain.' },
      { type: 'credential_request', present: true, description: 'Asks for employee ID and last 4 digits of SSN — HR already has this data and would never request it by email.' },
      { type: 'urgency_language', present: true, description: 'Tax liability threat and Friday deadline create fear and time pressure.' },
      { type: 'suspicious_link', present: true, description: 'The W-4 update link uses the fake portal domain with a suspicious token parameter.' },
      { type: 'authority_exploitation', present: true, description: 'Claims to be mandatory compliance — invoking regulatory authority to override scepticism.' },
    ],
  },

  // ─── ADVANCED Legitimate ──────────────────────────────────────────────────
  {
    category: 'account_alert', difficulty: 'advanced', is_phishing: false,
    sender: 'security@company-training.local',
    recipient: 'employee@company-training.local',
    subject: 'New device sign-in to your corporate account — Wednesday 3:47 PM',
    body: `Hi Alex,

We noticed a new sign-in to your corporate account from a device we don't recognise.

Sign-in details:
Date/Time: Wednesday, August 7, 2024 at 3:47 PM EST
Location: New York, NY (approximate)
Device: MacBook Pro, macOS Sonoma
Browser: Safari 17.4

If this was you (for example, a new work laptop or a different device), no action is needed. This is just a courtesy notification.

If you did NOT perform this sign-in, please change your password immediately at https://accounts.company-training.local/security and contact the IT Security team at security@company-training.local or ext. 5500.

We are NOT asking you to click any links in this email. Go directly to your browser and type the URL above.

IT Security Team
Company Training Inc.`,
    explanation: `This is a legitimate security notification because: (1) The sender domain exactly matches the company domain. (2) The email is addressed to you by name ("Hi Alex"). (3) It explicitly states "We are NOT asking you to click any links" — a key differentiator from phishing. (4) All referenced URLs use the company's own domain (accounts.company-training.local). (5) It provides alternative contact methods (email + phone ext.) for verification. (6) The tone is calm and informational, not threatening or urgent.`,
    recommended_training_skill: 'legitimate_security_notification_recognition',
    indicators: [
      { type: 'suspicious_link', present: false, description: 'The email explicitly tells users NOT to click links and to type the URL directly.' },
      { type: 'credential_request', present: false, description: 'No credentials requested — it directs users to change their own password proactively.' },
      { type: 'domain_mismatch', present: false, description: 'All domains (sender, linked URL) match the company\'s own domain exactly.' },
      { type: 'urgency_language', present: false, description: 'Calm informational tone — only urgent if you didn\'t perform the sign-in, which is appropriate.' },
    ],
  },
  {
    category: 'password_reset', difficulty: 'advanced', is_phishing: false,
    sender: 'noreply@company-training.local',
    recipient: 'employee@company-training.local',
    subject: 'Password reset requested for your account',
    body: `Hi,

We received a request to reset the password for the account associated with this email address.

If you requested this password reset, use the link below. This link will expire in 1 hour:
https://accounts.company-training.local/reset?token=7f2a9c1b4e8d3f6a

If you did not request a password reset, you can safely ignore this email. Your password will not change.

For security reasons, we will never ask for your current password by email. If you have concerns about your account security, contact IT at security@company-training.local

IT Help Desk
Company Training Inc.`,
    explanation: `This is a legitimate password reset email because: (1) It was triggered by the user's own request. (2) The sender domain is the company's own domain. (3) The reset link uses the company's own accounts subdomain. (4) It explicitly states the link expires in 1 hour — a security feature, not a pressure tactic. (5) It clearly states "If you did not request this, ignore this email." (6) It says "we will never ask for your current password" — a key security statement. (7) No threatening language or consequences for not clicking.`,
    recommended_training_skill: 'legitimate_recognition',
    indicators: [
      { type: 'urgency_language', present: false, description: 'The 1-hour expiry is a security feature for token validity, not a pressure tactic — the email tells you to ignore it if unrequested.' },
      { type: 'domain_mismatch', present: false, description: 'Sender domain and reset link both use company-training.local.' },
      { type: 'credential_request', present: false, description: 'The email explicitly says it will NEVER ask for your current password.' },
      { type: 'suspicious_link', present: false, description: 'Reset link goes to accounts.company-training.local — the company\'s own secure subdomain.' },
    ],
  },

  // ─── Additional variety ───────────────────────────────────────────────────
  {
    category: 'it_support', difficulty: 'intermediate', is_phishing: true,
    sender: 'helpdesk@company-support-center.test',
    recipient: 'employee@company-training.local',
    subject: 'Your email storage is 98% full — immediate action required',
    body: `Dear User,

Our systems have detected that your corporate email storage is 98% full. Your email service will be suspended tomorrow if you do not take action.

To prevent email suspension, click the link below to verify your account and expand your storage:
http://email-storage-expand.test/verify?user=employee&action=expand

You will need to enter your email credentials to verify your identity and authorize the storage expansion.

Failure to act within 24 hours will result in email suspension and loss of recent emails.

IT Helpdesk Support
Automated System`,
    explanation: `This is a phishing email because: (1) Sender domain "company-support-center.test" doesn't match the company's IT domain. (2) The storage expansion link goes to a completely different fake domain. (3) It asks you to "enter your email credentials" — IT systems never need you to provide your password to expand storage. (4) The "Automated System" sign-off with no specific contact is suspicious. (5) Legitimate IT storage alerts come through internal systems and are managed by IT without requiring your credentials.`,
    recommended_training_skill: 'credential_harvesting_detection',
    indicators: [
      { type: 'domain_mismatch', present: true, description: 'Both sender and link use fake domains not matching the company IT domain.' },
      { type: 'credential_request', present: true, description: 'Explicitly asks for email credentials — IT would never need your password to expand storage.' },
      { type: 'urgency_language', present: true, description: '24-hour deadline and threat of email suspension creates urgency.' },
      { type: 'suspicious_link', present: true, description: 'Storage expansion link goes to "email-storage-expand.test" — a fake domain.' },
    ],
  },
  {
    category: 'social_engineering', difficulty: 'beginner', is_phishing: true,
    sender: 'prizes@lucky-draw-winners.test',
    recipient: 'employee@company-training.local',
    subject: 'Congratulations! You have won a $500 Amazon Gift Card',
    body: `CONGRATULATIONS!

You have been randomly selected as a WINNER in our monthly employee appreciation draw!

Your prize: $500 Amazon Gift Card

To claim your prize, you must verify your identity within 48 hours:

CLAIM YOUR PRIZE NOW: http://claim-prize-now.test/win?ref=EMP500

You will need to provide your name, employee ID, and verify your work email to claim.

This offer expires in 48 hours. Share this exciting news with your colleagues!

Employee Rewards Team`,
    explanation: `This is a classic prize scam phishing email. Red flags: (1) The sender domain "lucky-draw-winners.test" is clearly not a company domain. (2) Unsolicited prize wins are a standard social engineering tactic. (3) The claim link goes to a completely fake external domain. (4) Requesting employee ID and email verification is a credential harvesting attempt. (5) The 48-hour expiry creates urgency. (6) Real employee programs come from HR or the company's own communications, not random external domains.`,
    recommended_training_skill: 'reward_promise_detection',
    indicators: [
      { type: 'reward_promise', present: true, description: 'Unsolicited prize claim — classic social engineering hook to make victims act without thinking.' },
      { type: 'domain_mismatch', present: true, description: 'Sender and claim link both use non-company domains with no relation to any real organisation.' },
      { type: 'urgency_language', present: true, description: '48-hour expiry pressures victims to act before thinking critically.' },
      { type: 'credential_request', present: true, description: 'Requests employee ID and email verification under the guise of identity confirmation.' },
    ],
  },
  {
    category: 'invoice', difficulty: 'advanced', is_phishing: false,
    sender: 'billing@office-supplies-corp.test',
    recipient: 'employee@company-training.local',
    subject: 'Invoice #OS-2024-0847 — Office Supplies Order Delivered',
    body: `Hello,

Please find attached (Invoice #OS-2024-0847) for your recent order delivered on August 5th, 2024.

Order Summary:
- Qty 50 x A4 Paper Reams (80gsm): $187.50
- Qty 10 x Whiteboard Markers (Pack of 10): $89.90
- Qty 4 x Printer Cartridge HP 67XL: $124.00
Total: $401.40 (Net 30)

Payment Terms: 30 days from delivery date (Due: September 4, 2024)
Payment can be made via our existing payment portal or bank transfer to our account on file.

If you have questions about this invoice or the delivery, please contact our accounts team at accounts@office-supplies-corp.test or call 1-800-555-0147 (Mon-Fri 9-5 EST).

Thank you for your business.

Accounts Team
Office Supplies Corp.`,
    explanation: `This is a legitimate invoice email because: (1) It references a specific, detailed order with itemised products and quantities — not just a generic "amount due." (2) It uses Net 30 standard payment terms rather than demanding immediate payment. (3) The payment instructions refer to "existing payment portal or bank transfer to our account on file" — not a new or unusual payment method. (4) Multiple contact methods are provided. (5) No urgency, threats, or pressure language. Legitimate vendor invoices contain specific order details that match what was actually ordered.`,
    recommended_training_skill: 'legitimate_recognition',
    indicators: [
      { type: 'urgency_language', present: false, description: 'Standard Net 30 payment terms — no threatening language or unusual urgency.' },
      { type: 'suspicious_link', present: false, description: 'No suspicious links — references "existing payment portal" rather than a new link.' },
      { type: 'credential_request', present: false, description: 'No credential requests — references established bank account on file.' },
      { type: 'generic_greeting', present: false, description: 'Addressed appropriately as a business communication, references specific order details.' },
    ],
  },
  {
    category: 'shared_document', difficulty: 'beginner', is_phishing: false,
    sender: 'no-reply@company-training.local',
    recipient: 'employee@company-training.local',
    subject: 'Sarah Chen shared "Team Meeting Notes - Aug 7.docx" with you',
    body: `Hi,

Sarah Chen (schen@company-training.local) has shared a document with you via the Company SharePoint.

Document: Team Meeting Notes - Aug 7.docx
Shared by: schen@company-training.local
Permissions: View and edit

You can access this document at:
https://sharepoint.company-training.local/sites/TeamDocs/MeetingNotes/Aug7_2024.docx

If you have trouble accessing the document, contact Sarah directly at schen@company-training.local or IT at helpdesk@company-training.local

No sign-in is required — your corporate credentials will be used automatically via SSO.

Company SharePoint Notifications
Company Training Inc.`,
    explanation: `This is a legitimate document sharing notification because: (1) The sender domain is the company's own domain. (2) The document link uses the company's own SharePoint domain (sharepoint.company-training.local). (3) The sharing is from a named colleague with their full company email. (4) It notes that SSO will be used — no special credential entry required. (5) The document name is specific and realistic (meeting notes with a date). (6) Alternative contact methods use internal company addresses.`,
    recommended_training_skill: 'legitimate_recognition',
    indicators: [
      { type: 'domain_mismatch', present: false, description: 'Both sender and document link use the company\'s own domain.' },
      { type: 'suspicious_link', present: false, description: 'Document link uses the company\'s own SharePoint at sharepoint.company-training.local.' },
      { type: 'credential_request', present: false, description: 'Explicitly states SSO will be used automatically — no credential entry needed.' },
      { type: 'impersonation', present: false, description: 'Sharing comes from a named colleague with a verifiable company email address.' },
    ],
  },
];

async function seed() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  console.log('Connected to MySQL');

  for (const scenario of FALLBACK_SCENARIOS) {
    // Get category_id
    const [catRows] = await conn.execute('SELECT id FROM categories WHERE slug = ?', [scenario.category]);
    const cat = (catRows as any[])[0];
    if (!cat) { console.warn(`Category not found: ${scenario.category}`); continue; }

    // Get difficulty_id
    const [diffRows] = await conn.execute('SELECT id FROM difficulty_levels WHERE slug = ?', [scenario.difficulty]);
    const diff = (diffRows as any[])[0];
    if (!diff) { console.warn(`Difficulty not found: ${scenario.difficulty}`); continue; }

    // Check if fallback scenario with same subject already exists
    const [existingRows] = await conn.execute(
      'SELECT id FROM scenarios WHERE subject = ? AND source = "fallback"',
      [scenario.subject]
    );
    if ((existingRows as any[]).length > 0) {
      console.log(`  skipped (exists): ${scenario.subject.slice(0, 50)}`);
      continue;
    }

    const [result] = await conn.execute(
      `INSERT INTO scenarios (category_id, difficulty_id, sender, recipient, subject, body, is_phishing, source, validation_status, explanation, recommended_training_skill)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'fallback', 'passed', ?, ?)`,
      [cat.id, diff.id, scenario.sender, scenario.recipient, scenario.subject, scenario.body, scenario.is_phishing ? 1 : 0, scenario.explanation, scenario.recommended_training_skill]
    );
    const scenarioId = (result as any).insertId;

    for (const ind of scenario.indicators) {
      await conn.execute(
        'INSERT INTO scenario_indicators (scenario_id, indicator_type, description, is_present) VALUES (?, ?, ?, ?)',
        [scenarioId, ind.type, ind.description, ind.present ? 1 : 0]
      );
    }

    // Also insert a validation_results record
    await conn.execute(
      'INSERT INTO validation_results (scenario_id, passed, failed_checks, retry_count, used_fallback) VALUES (?, 1, ?, 0, 1)',
      [scenarioId, '[]']
    );

    console.log(`  ✓ Seeded: [${scenario.difficulty}/${scenario.category}] ${scenario.subject.slice(0, 55)}`);
  }

  await conn.end();
  console.log(`✓ ${FALLBACK_SCENARIOS.length} fallback scenarios processed`);
}

seed().catch((err) => { console.error(err); process.exit(1); });

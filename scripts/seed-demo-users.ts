#!/usr/bin/env node
/**
 * Demo user seed — creates User A and User B with diverging performance histories
 * that visibly demonstrate the adaptive engine selecting different next scenarios.
 *
 * User A: Strong at URL/domain detection, Weak at urgency/authority social engineering
 * User B: Strong at urgency/authority detection, Weak at URL/domain/attachment detection
 *
 * Run: npx ts-node --project tsconfig.json scripts/seed-demo-users.ts
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

async function seed() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  console.log('Connected to MySQL');

  // ─── Helper: get IDs ──────────────────────────────────────────────────────
  async function getCategoryId(slug: string): Promise<number> {
    const [rows] = await conn.execute('SELECT id FROM categories WHERE slug = ?', [slug]);
    return (rows as any[])[0]?.id;
  }
  async function getDifficultyId(slug: string): Promise<number> {
    const [rows] = await conn.execute('SELECT id FROM difficulty_levels WHERE slug = ?', [slug]);
    return (rows as any[])[0]?.id;
  }

  // Get a seeded fallback scenario for a given category/difficulty
  async function getFallbackScenarioId(categorySlug: string, difficultySlug: string): Promise<number | null> {
    const [rows] = await conn.execute(
      `SELECT s.id FROM scenarios s
       JOIN categories c ON c.id = s.category_id
       JOIN difficulty_levels d ON d.id = s.difficulty_id
       WHERE s.source = 'fallback' AND c.slug = ? AND d.slug = ?
       LIMIT 1`,
      [categorySlug, difficultySlug]
    );
    return (rows as any[])[0]?.id ?? null;
  }

  // ─── Create or get demo user ──────────────────────────────────────────────
  async function upsertUser(name: string, email: string, password: string, role: string = 'user'): Promise<number> {
    const [existing] = await conn.execute('SELECT id FROM users WHERE email = ?', [email]);
    if ((existing as any[]).length > 0) {
      console.log(`  User exists, reusing: ${email}`);
      return (existing as any[])[0].id;
    }
    const hash = await bcrypt.hash(password, 12);
    const [result] = await conn.execute(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, hash, role]
    );
    return (result as any).insertId;
  }

  // ─── Upsert performance record ─────────────────────────────────────────────
  async function upsertPerf(userId: number, categoryId: number, indicatorType: string, difficultyId: number, correct: number, incorrect: number) {
    await conn.execute(
      `INSERT INTO user_performance (user_id, category_id, indicator_type, difficulty_id, correct_count, incorrect_count)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE correct_count = correct_count + VALUES(correct_count), incorrect_count = incorrect_count + VALUES(incorrect_count)`,
      [userId, categoryId, indicatorType, difficultyId, correct, incorrect]
    );
  }

  async function upsertSkill(userId: number, skillArea: string, level: 'strong' | 'moderate' | 'weak', accuracy: number) {
    await conn.execute(
      `INSERT INTO user_skills (user_id, skill_area, proficiency_level, accuracy_score)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE proficiency_level = VALUES(proficiency_level), accuracy_score = VALUES(accuracy_score)`,
      [userId, skillArea, level, accuracy]
    );
  }

  async function addAttempts(userId: number, sessionId: number, categorySlug: string, difficultySlug: string, correct: number, incorrect: number) {
    const scenarioId = await getFallbackScenarioId(categorySlug, difficultySlug);
    if (!scenarioId) return;

    const total = correct + incorrect;
    for (let i = 0; i < total; i++) {
      const isCorrect = i < correct ? 1 : 0;
      const decision = isCorrect ? 'phishing' : 'legitimate';
      await conn.execute(
        `INSERT INTO user_attempts (session_id, user_id, scenario_id, user_decision, indicators_selected, is_correct, score)
         VALUES (?, ?, ?, ?, '[]', ?, ?)`,
        [sessionId, userId, scenarioId, decision, isCorrect, isCorrect ? 100 : 0]
      );
    }
  }

  // ─── Create demo users ────────────────────────────────────────────────────
  console.log('\nCreating demo users…');

  const userAId = await upsertUser('Alex Rivera (Demo A)', 'usera@demo.local', 'Password123!');
  const userBId = await upsertUser('Morgan Chen (Demo B)', 'userb@demo.local', 'Password123!');
  const adminId = await upsertUser('Admin User', 'admin@demo.local', 'Admin123!', 'admin');

  console.log(`  ✓ User A (ID: ${userAId}): Strong at URL/domain, Weak at urgency/authority`);
  console.log(`  ✓ User B (ID: ${userBId}): Strong at urgency/authority, Weak at URL/domain`);
  console.log(`  ✓ Admin  (ID: ${adminId})`);

  // Create training sessions for each user
  const [sessionA] = await conn.execute(
    'INSERT INTO training_sessions (user_id) VALUES (?)', [userAId]
  );
  const [sessionB] = await conn.execute(
    'INSERT INTO training_sessions (user_id) VALUES (?)', [userBId]
  );
  const sessionAId = (sessionA as any).insertId;
  const sessionBId = (sessionB as any).insertId;

  // ─── USER A performance ───────────────────────────────────────────────────
  // STRONG areas: URL/domain detection → password_reset, account_alert (domain_mismatch, suspicious_link)
  // WEAK areas: urgency/authority → social_engineering, hr_communication (urgency_language, authority_exploitation)
  console.log('\nSeeding User A performance…');

  const pwResetId = await getCategoryId('password_reset');
  const accountAlertId = await getCategoryId('account_alert');
  const socialEngId = await getCategoryId('social_engineering');
  const hrComId = await getCategoryId('hr_communication');
  const invoiceId = await getCategoryId('invoice');
  const itSupportId = await getCategoryId('it_support');
  const sharedDocId = await getCategoryId('shared_document');

  const beginId = await getDifficultyId('beginner');
  const midId = await getDifficultyId('intermediate');
  const advId = await getDifficultyId('advanced');

  // User A — Strong at domain/URL detection (password_reset, account_alert)
  await upsertPerf(userAId, pwResetId, 'general', beginId, 8, 1);          // 89% — strong
  await upsertPerf(userAId, pwResetId, 'domain_mismatch', beginId, 7, 1);
  await upsertPerf(userAId, pwResetId, 'suspicious_link', beginId, 7, 0);
  await upsertPerf(userAId, accountAlertId, 'general', midId, 6, 1);       // 86% — strong
  await upsertPerf(userAId, accountAlertId, 'domain_mismatch', midId, 5, 1);

  // User A — Weak at urgency/authority (social_engineering, hr_communication)
  await upsertPerf(userAId, socialEngId, 'general', midId, 2, 5);          // 29% — very weak
  await upsertPerf(userAId, socialEngId, 'urgency_language', midId, 1, 4); // repeatedly missed
  await upsertPerf(userAId, socialEngId, 'authority_exploitation', midId, 1, 3);
  await upsertPerf(userAId, hrComId, 'general', beginId, 3, 5);            // 38% — weak
  await upsertPerf(userAId, hrComId, 'urgency_language', beginId, 1, 4);   // repeatedly missed
  await upsertPerf(userAId, hrComId, 'authority_exploitation', beginId, 0, 3); // never caught

  // User A — Moderate at invoice/IT support
  await upsertPerf(userAId, invoiceId, 'general', beginId, 4, 3);          // 57%
  await upsertPerf(userAId, itSupportId, 'general', beginId, 4, 4);       // 50%

  // Add actual attempts for User A
  await addAttempts(userAId, sessionAId, 'password_reset', 'beginner', 8, 1);
  await addAttempts(userAId, sessionAId, 'social_engineering', 'intermediate', 2, 5);
  await addAttempts(userAId, sessionAId, 'hr_communication', 'beginner', 3, 5);
  await addAttempts(userAId, sessionAId, 'invoice', 'beginner', 4, 3);

  // User A skill profile
  await upsertSkill(userAId, 'password_reset', 'strong', 89);
  await upsertSkill(userAId, 'account_alert', 'strong', 86);
  await upsertSkill(userAId, 'social_engineering', 'weak', 29);
  await upsertSkill(userAId, 'hr_communication', 'weak', 38);
  await upsertSkill(userAId, 'invoice', 'moderate', 57);
  await upsertSkill(userAId, 'it_support', 'moderate', 50);

  console.log('  ✓ User A performance seeded');

  // ─── USER B performance ───────────────────────────────────────────────────
  // STRONG areas: urgency/authority detection → social_engineering, account_alert
  // WEAK areas: URL/domain/attachment → shared_document, invoice (domain_mismatch, suspicious_link, attachment_warning)
  console.log('Seeding User B performance…');

  // User B — Strong at urgency/authority detection
  await upsertPerf(userBId, socialEngId, 'general', midId, 7, 1);          // 88% — strong
  await upsertPerf(userBId, socialEngId, 'urgency_language', midId, 6, 1);
  await upsertPerf(userBId, socialEngId, 'authority_exploitation', midId, 7, 0);
  await upsertPerf(userBId, accountAlertId, 'general', beginId, 7, 1);     // 88% — strong
  await upsertPerf(userBId, accountAlertId, 'urgency_language', beginId, 6, 1);

  // User B — Weak at URL/domain/attachment (shared_document, invoice)
  await upsertPerf(userBId, sharedDocId, 'general', beginId, 2, 6);        // 25% — very weak
  await upsertPerf(userBId, sharedDocId, 'domain_mismatch', beginId, 1, 5); // repeatedly missed
  await upsertPerf(userBId, sharedDocId, 'suspicious_link', beginId, 1, 4); // repeatedly missed
  await upsertPerf(userBId, invoiceId, 'general', beginId, 2, 5);           // 29% — very weak
  await upsertPerf(userBId, invoiceId, 'domain_mismatch', beginId, 0, 4);   // never caught
  await upsertPerf(userBId, invoiceId, 'attachment_warning', beginId, 1, 4); // weak

  // User B — Moderate at password_reset, IT support
  await upsertPerf(userBId, pwResetId, 'general', beginId, 4, 3);           // 57%
  await upsertPerf(userBId, itSupportId, 'general', beginId, 5, 3);         // 63%

  // Add actual attempts for User B
  await addAttempts(userBId, sessionBId, 'social_engineering', 'intermediate', 7, 1);
  await addAttempts(userBId, sessionBId, 'shared_document', 'beginner', 2, 6);
  await addAttempts(userBId, sessionBId, 'invoice', 'beginner', 2, 5);
  await addAttempts(userBId, sessionBId, 'password_reset', 'beginner', 4, 3);

  // User B skill profile
  await upsertSkill(userBId, 'social_engineering', 'strong', 88);
  await upsertSkill(userBId, 'account_alert', 'strong', 88);
  await upsertSkill(userBId, 'shared_document', 'weak', 25);
  await upsertSkill(userBId, 'invoice', 'weak', 29);
  await upsertSkill(userBId, 'password_reset', 'moderate', 57);
  await upsertSkill(userBId, 'it_support', 'moderate', 63);

  console.log('  ✓ User B performance seeded');

  await conn.end();

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('Demo users seeded successfully!');
  console.log('');
  console.log('Login credentials:');
  console.log('  User A: usera@demo.local / Password123!');
  console.log('    → Adaptive engine will serve: social_engineering, hr_communication');
  console.log('    → (urgency/authority weakness, difficulty: intermediate)');
  console.log('');
  console.log('  User B: userb@demo.local / Password123!');
  console.log('    → Adaptive engine will serve: shared_document, invoice');
  console.log('    → (domain/URL weakness, difficulty: beginner)');
  console.log('');
  console.log('  Admin:  admin@demo.local / Admin123!');
  console.log('    → Full admin dashboard access');
  console.log('═══════════════════════════════════════════════════════\n');
}

seed().catch((err) => { console.error(err); process.exit(1); });

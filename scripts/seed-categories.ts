#!/usr/bin/env node
/**
 * Seed script — categories and difficulty levels
 * Run: npx ts-node --project tsconfig.json scripts/seed-categories.ts
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';

async function seed() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);

  const categories = [
    { name: 'Password Reset', slug: 'password_reset', description: 'Fake password reset emails designed to harvest credentials through urgency and impersonation.' },
    { name: 'HR Communication', slug: 'hr_communication', description: 'Phishing emails impersonating HR departments about payroll, benefits, and policy changes.' },
    { name: 'Invoice & Billing', slug: 'invoice', description: 'Fraudulent invoices and payment request emails from fake vendors or suppliers.' },
    { name: 'Shared Document', slug: 'shared_document', description: 'Fake document sharing notifications from collaboration tools like OneDrive or Google Drive.' },
    { name: 'Account Alert', slug: 'account_alert', description: 'Fake security alerts about suspicious account activity designed to trick users into clicking links.' },
    { name: 'IT Support', slug: 'it_support', description: 'Emails impersonating internal IT support requesting credentials or system access.' },
    { name: 'Social Engineering', slug: 'social_engineering', description: 'Broad social engineering attacks exploiting authority, urgency, or trust relationships.' },
  ];

  const difficulties = [
    { name: 'Beginner', slug: 'beginner', numeric_rank: 1 },
    { name: 'Intermediate', slug: 'intermediate', numeric_rank: 2 },
    { name: 'Advanced', slug: 'advanced', numeric_rank: 3 },
  ];

  console.log('Seeding categories…');
  for (const cat of categories) {
    await conn.execute(
      `INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description)`,
      [cat.name, cat.slug, cat.description]
    );
    console.log(`  ✓ ${cat.name}`);
  }

  console.log('Seeding difficulty levels…');
  for (const diff of difficulties) {
    await conn.execute(
      `INSERT INTO difficulty_levels (name, slug, numeric_rank) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE name=VALUES(name), numeric_rank=VALUES(numeric_rank)`,
      [diff.name, diff.slug, diff.numeric_rank]
    );
    console.log(`  ✓ ${diff.name}`);
  }

  await conn.end();
  console.log('✓ Categories and difficulty levels seeded');
}

seed().catch((err) => { console.error(err); process.exit(1); });

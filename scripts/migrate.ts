#!/usr/bin/env node
/**
 * Migration runner — reads all .sql files in /migrations, sorts by filename,
 * and executes them in order using mysql2 directly (not Kysely Migrator,
 * to keep SQL files as the canonical source of truth).
 *
 * Usage: npx ts-node scripts/migrate.ts
 * Or add to package.json scripts: "migrate": "npx ts-node scripts/migrate.ts"
 */
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';

async function run() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL is not set. Did you create .env.local?');
  }

  const connection = await mysql.createConnection({
    uri: dbUrl,
    multipleStatements: true,
  });
  console.log('✓ Connected to MySQL');

  // Create migrations tracking table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      filename   VARCHAR(255) NOT NULL UNIQUE,
      applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  const migrationsDir = path.join(process.cwd(), 'migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const [rows] = await connection.query(
      'SELECT id FROM _migrations WHERE filename = ?',
      [file]
    );
    if ((rows as any[]).length > 0) {
      console.log(`  skipped (already applied): ${file}`);
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    await connection.query(sql);

    await connection.query(
      'INSERT INTO _migrations (filename) VALUES (?)',
      [file]
    );
    console.log(`  ✓ Applied: ${file}`);
  }

  await connection.end();
  console.log('✓ All migrations complete');
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

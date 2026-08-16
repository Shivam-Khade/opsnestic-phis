import { Kysely, MysqlDialect } from 'kysely';
import { createPool } from 'mysql2';
import type { DB } from './types';

const pool = createPool({
  uri: process.env.DATABASE_URL,
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
});

export const db = new Kysely<DB>({
  dialect: new MysqlDialect({ pool }),
});

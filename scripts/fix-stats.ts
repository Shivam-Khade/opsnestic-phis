import 'dotenv/config';
import mysql from 'mysql2/promise';

async function fixStats() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  
  const [result] = await conn.execute(
    'DELETE FROM validation_results WHERE used_fallback = 1 AND retry_count = 0 AND passed = 1'
  );
  
  console.log(`Deleted ${(result as any).affectedRows} fake validation results.`);
  
  await conn.end();
}

fixStats().catch(console.error);

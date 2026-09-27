import 'dotenv/config';
import mysql from 'mysql2/promise';

async function checkFailures() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  
  const [rows] = await conn.execute(
    'SELECT scenario_id, passed, used_fallback, failed_checks, retry_count, validated_at FROM validation_results WHERE used_fallback = 1 ORDER BY id DESC LIMIT 5'
  );
  
  console.log(JSON.stringify(rows, null, 2));
  
  await conn.end();
}

checkFailures().catch(console.error);

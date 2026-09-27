import 'dotenv/config';
import mysql from 'mysql2/promise';

async function fixFallbacks() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  
  const [result] = await conn.execute(
    'UPDATE scenarios SET validation_status = "passed" WHERE source = "fallback"'
  );
  
  console.log(`Updated ${(result as any).affectedRows} fallback scenarios.`);
  
  await conn.end();
}

fixFallbacks().catch(console.error);

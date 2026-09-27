import 'dotenv/config';
import mysql from 'mysql2/promise';

async function clearFallbacks() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  console.log('Connected to MySQL');

  // Delete validation results for fallbacks
  await conn.execute('DELETE vr FROM validation_results vr INNER JOIN scenarios s ON vr.scenario_id = s.id WHERE s.source = "fallback"');
  
  // Delete indicators for fallbacks
  await conn.execute('DELETE si FROM scenario_indicators si INNER JOIN scenarios s ON si.scenario_id = s.id WHERE s.source = "fallback"');

  // Delete attempts for fallbacks
  await conn.execute('DELETE ua FROM user_attempts ua INNER JOIN scenarios s ON ua.scenario_id = s.id WHERE s.source = "fallback"');

  // Delete the fallback scenarios themselves
  const [result] = await conn.execute('DELETE FROM scenarios WHERE source = "fallback"');
  
  console.log(`Deleted ${(result as any).affectedRows} fallback scenarios.`);
  await conn.end();
}

clearFallbacks().catch(console.error);

import 'dotenv/config';
import { generateAndPersistScenario } from './lib/services/scenario.service';

async function testGeneration() {
  try {
    const result = await generateAndPersistScenario({
      userId: 1, // Demo user A
      category: 'social_engineering',
      difficulty: 'beginner',
      forcePhishing: true
    });
    console.log('Generation result:', result);
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}

testGeneration();

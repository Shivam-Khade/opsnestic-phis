import 'dotenv/config';
import { OpenRouterProvider } from './lib/ai/openrouter-provider';

async function testProvider() {
  const provider = new OpenRouterProvider();
  try {
    console.log('Sending request to OpenRouter...');
    const result = await provider.generateScenario({
      category: 'password_reset',
      difficulty: 'beginner',
      forcePhishing: true
    });
    console.log('Success:', result);
  } catch (error) {
    console.error('Failed:', error);
  }
}

testProvider();

import type { AiProvider } from './types';

import { GeminiProvider } from './gemini-provider';
import { OpenRouterProvider } from './openrouter-provider';

let instance: AiProvider | null = null;

export function getAiProvider(): AiProvider {
  if (instance) return instance;

  const provider = process.env.AI_PROVIDER ?? 'gemini';

  if (provider === 'gemini') {
    instance = new GeminiProvider();
    return instance;
  }

  if (provider === 'openrouter') {
    instance = new OpenRouterProvider();
    return instance;
  }

  // Future adapters: 'groq' etc.
  throw new Error(
    `Unknown AI_PROVIDER: "${provider}". Supported values: gemini, openrouter`
  );
}

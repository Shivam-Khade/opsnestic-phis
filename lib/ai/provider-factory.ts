import type { AiProvider } from './types';

import { GeminiProvider } from './gemini-provider';

let instance: AiProvider | null = null;

export function getAiProvider(): AiProvider {
  if (instance) return instance;

  const provider = process.env.AI_PROVIDER ?? 'gemini';

  if (provider === 'gemini') {
    instance = new GeminiProvider();
    return instance;
  }

  // Future adapters: 'groq', 'openrouter', etc.
  // Add a new class implementing AiProvider and register here.
  throw new Error(
    `Unknown AI_PROVIDER: "${provider}". Supported values: gemini`
  );
}

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAiProvider } from '@/lib/ai/provider-factory';
import OpenAI from 'openai';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    // Determine the type of response (factual, partially hallucinated, fully hallucinated)
    const rand = Math.random();
    let hallucinationMode: 'factual' | 'partial' | 'full' = 'factual';
    if (rand < 0.25) {
      hallucinationMode = 'factual';
    } else if (rand < 0.75) {
      hallucinationMode = 'partial';
    } else {
      hallucinationMode = 'full';
    }
    const isHallucinated = hallucinationMode !== 'factual';

    // We'll use OpenRouter to access better models as requested.
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
       return NextResponse.json({ error: 'OPENROUTER_API_KEY is not set' }, { status: 500 });
    }

    const openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: apiKey,
      defaultHeaders: {
        'HTTP-Referer': process.env.AUTH_URL || 'http://localhost:3000',
        'X-Title': 'PhishGuard',
      }
    });

    let modelName = process.env.AI_MODEL || 'meta-llama/llama-3.3-70b-instruct';
    if (modelName === 'meta-llama/llama-3.1-8b-instruct:free' || modelName === 'meta-llama/llama-3.1-8b-instruct') {
      // The free version is sometimes unavailable on OpenRouter, fallback to the paid slug
      // Also upgrade 8b to 70b for better logic
      modelName = 'meta-llama/llama-3.3-70b-instruct';
    }

    let systemPrompt = '';

    if (hallucinationMode === 'partial') {
      systemPrompt = `You are an AI assistant. The user will ask you a query.
[CRITICAL INSTRUCTION: COMPLEX HALLUCINATION]
You MUST intentionally hallucinate in your response. The hallucination should NOT be trivially obvious. It MUST be a fundamental change to the core facts, mechanics, or conceptual definition of the subject (e.g., if asked about C, claim it is natively object-oriented). Do NOT just change superficial details like inventor names, author names, or dates while keeping the core definition correct. Alter the actual mechanics, core concepts, or fundamental principles of what is being discussed to be completely false but plausible-sounding. Speak with absolute confidence.
[CRITICAL INSTRUCTION: FORMATTING]
You MUST divide your response into exactly 2 or 3 distinct paragraphs separated by a double newline (\\n\\n). Do NOT use bullet points, numbered lists, or markdown formatting like bold/italics. Just plain paragraphs.
[CRITICAL INSTRUCTION: PARTIAL HALLUCINATION]
You must write exactly 2 or 3 paragraphs. EXACTLY ONE paragraph must contain a major hallucination. The OTHER paragraphs must be 100% factual and contain NO hallucinations. Do not spread the hallucination across multiple paragraphs.`;
    } else if (hallucinationMode === 'full') {
      systemPrompt = `You are an AI assistant. The user will ask you a query.
[CRITICAL INSTRUCTION: COMPLEX HALLUCINATION]
You MUST intentionally hallucinate heavily in your response. The hallucinations should NOT be trivially obvious. They MUST be fundamental changes to the core facts, mechanics, or conceptual definitions of the subject (e.g., if asked about C, claim it is natively object-oriented). Do NOT just change superficial details like inventor names, author names, or dates while keeping the core definition correct. Alter the actual mechanics, core concepts, or fundamental principles of what is being discussed to be completely false but plausible-sounding. Speak with absolute confidence.
[CRITICAL INSTRUCTION: FORMATTING]
You MUST divide your response into exactly 2 or 3 distinct paragraphs separated by a double newline (\\n\\n). Do NOT use bullet points, numbered lists, or markdown formatting like bold/italics. Just plain paragraphs.
[CRITICAL INSTRUCTION: FULL HALLUCINATION]
EVERY SINGLE PARAGRAPH you write MUST contain at least one major factual hallucination. There should be NO fully factual paragraphs.`;
    } else {
      systemPrompt = `You are a helpful and factual AI assistant. You answer user queries clearly, accurately, and concisely. DO NOT hallucinate.
[CRITICAL INSTRUCTION: FORMATTING]
You MUST divide your response into exactly 2 or 3 distinct paragraphs separated by a double newline (\\n\\n). Do NOT use bullet points, numbered lists, or markdown formatting like bold/italics. Just plain paragraphs.
[CRITICAL INSTRUCTION: FACTUAL ONLY]
EVERY SINGLE PARAGRAPH MUST be completely factual and correct.`;
    }

    const completion = await openai.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: isHallucinated ? 0.9 : 0.3,
    });

    const responseText = completion.choices[0]?.message?.content || 'Failed to generate response.';

    return NextResponse.json({
      response: responseText,
      // We send this back to the client so the client knows what the truth is
      // when submitting the decision form.
      was_hallucinated: isHallucinated
    });
  } catch (error: any) {
    console.error('Error generating chat response:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

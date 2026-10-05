import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import type { NewChatHallucinationAttempt } from '@/lib/db/types';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = Number(session.user.id);

    const body = await req.json();
    const { query, chunks, was_hallucinated } = body;

    if (!query || !chunks || !Array.isArray(chunks) || chunks.length === 0 || was_hallucinated === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    
    // We will build a default response array in case the AI judge fails
    let chunkResults = chunks.map((chunk: any) => {
       const isUserHallucination = chunk.user_decision === 'hallucination';
       const isDecisionCorrect = (was_hallucinated && isUserHallucination) || (!was_hallucinated && !isUserHallucination);
       return {
         text: chunk.text,
         actualHallucination: was_hallucinated, // default to overall flag if judge fails
         userCorrect: false, // Default to false if AI can't validate reasoning
         decisionCorrect: isDecisionCorrect,
         reasoningCorrect: false,
         feedback: 'The AI judge could not evaluate this specific chunk.'
       };
    });

    const chunksJson = JSON.stringify(chunks.map((c: any, i: number) => ({ id: i, text: c.text, user_decision: c.user_decision, user_reasoning: c.user_reasoning })));
    
    const judgePrompt = `You are an expert fact-checker with access to Google Search. 
The user asked: "${query}"

The AI's response was divided into the following chunks. For each chunk, the user has evaluated whether it contains a hallucination, and provided reasoning.
Chunks and User Evaluations:
${chunksJson}

Your task is to verify if EACH chunk contains a factual hallucination (a completely false factual error, historical event, scientific concept, non-existent entity, or made-up feature that does not exist in reality). 
Use Google Search to verify if the claims, steps, or features described in each chunk actually exist and are accurate.
Additionally, you MUST evaluate the validity and correctness of the user's reasoning. If their reasoning is logically flawed, factually incorrect, or does not support their decision, you must mark their reasoning as incorrect.

Return ONLY a JSON array with an evaluation object for each chunk, in the same order.
Exact structure required:
[
  {
    "id": 0,
    "is_hallucination": true or false,
    "is_decision_correct": true or false,
    "is_reasoning_correct": true or false,
    "feedback": "A short 2-3 sentence feedback explaining why the chunk is factual or hallucinated, AND explicitly commenting on whether the user's reasoning was sound or flawed."
  }
]`;

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // Using gemini-1.5-flash with Google Search grounding enabled
        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          // tools: [{ googleSearch: {} }], // Commented out to fix TS2353 error
        });

        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: judgePrompt }] }],
          generationConfig: {
            temperature: 0.1,
          },
        });

        let judgeResponseText = result.response.text();
        judgeResponseText = judgeResponseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const judgeData = JSON.parse(judgeResponseText);
        
        if (Array.isArray(judgeData) && judgeData.length === chunks.length) {
           chunkResults = chunks.map((chunk: any, i: number) => ({
             text: chunk.text,
             actualHallucination: judgeData[i].is_hallucination,
             userCorrect: judgeData[i].is_decision_correct && judgeData[i].is_reasoning_correct,
             decisionCorrect: judgeData[i].is_decision_correct,
             reasoningCorrect: judgeData[i].is_reasoning_correct,
             feedback: judgeData[i].feedback
           }));
        }
      } catch (e: any) {
        console.error('Error during LLM judgment with Gemini, falling back to OpenRouter:', e);
        try {
          const openRouterApiKey = process.env.OPENROUTER_API_KEY;
          if (openRouterApiKey) {
            const OpenAI = (await import('openai')).default;
            const openai = new OpenAI({
              baseURL: 'https://openrouter.ai/api/v1',
              apiKey: openRouterApiKey,
              defaultHeaders: {
                'HTTP-Referer': process.env.AUTH_URL || 'http://localhost:3000',
                'X-Title': 'PhishGuard',
              }
            });
            const openRouterResult = await openai.chat.completions.create({
              model: 'meta-llama/llama-3.3-70b-instruct',
              messages: [{ role: 'user', content: judgePrompt }],
              temperature: 0.1,
            });
            let text = openRouterResult.choices[0]?.message?.content || '';
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const judgeData = JSON.parse(text);
            if (Array.isArray(judgeData) && judgeData.length === chunks.length) {
               chunkResults = chunks.map((chunk: any, i: number) => ({
                 text: chunk.text,
                 actualHallucination: judgeData[i].is_hallucination,
                 userCorrect: judgeData[i].is_decision_correct && judgeData[i].is_reasoning_correct,
                 decisionCorrect: judgeData[i].is_decision_correct,
                 reasoningCorrect: judgeData[i].is_reasoning_correct,
                 feedback: judgeData[i].feedback
               }));
            }
          }
        } catch (openRouterError) {
          console.error('OpenRouter fallback also failed:', openRouterError);
        }
      }
    }

    const totalChunks = chunkResults.length;
    const correctChunks = chunkResults.filter(r => r.userCorrect).length;
    
    let label: 'Correct' | 'Partial' | 'Incorrect' = 'Incorrect';
    if (correctChunks === totalChunks) label = 'Correct';
    else if (correctChunks > 0) label = 'Partial';
    
    const overall_hallucinated = chunkResults.some(r => r.actualHallucination);
    const overall_is_correct = label === 'Correct';
    const overall_user_decision = chunks.some((c: any) => c.user_decision === 'hallucination') ? 'hallucination' : 'factual';

    await db
      .insertInto('chat_hallucination_attempts')
      .values({
        user_id: userId,
        query,
        response: chunks.map((c: any) => c.text).join('\n\n'),
        was_hallucinated: overall_hallucinated ? 1 : 0,
        user_decision: overall_user_decision,
        user_reasoning: JSON.stringify(chunkResults),
        is_correct: overall_is_correct ? 1 : 0,
      } as NewChatHallucinationAttempt)
      .execute();

    return NextResponse.json({ 
      success: true, 
      label,
      scoreText: `You got ${correctChunks} out of ${totalChunks} correct.`,
      chunkResults 
    });
  } catch (error: any) {
    console.error('Error submitting hallucination decision:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

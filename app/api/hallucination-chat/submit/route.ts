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
    const { query, response, was_hallucinated, user_decision, user_reasoning } = body;

    if (!query || !response || was_hallucinated === undefined || !user_decision || !user_reasoning) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let actual_hallucination = was_hallucinated;
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // Using gemini-1.5-pro for better reasoning, with Google Search grounding enabled
        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-pro',
          tools: [{ googleSearch: {} }],
        });
        
        const judgePrompt = `You are an expert fact-checker with access to Google Search. 
The user asked: "${query}"
The AI responded: "${response}"

Verify if the AI's response contains a factual hallucination (a completely false factual error, historical event, scientific concept, non-existent entity, or made-up feature that does not exist in reality). 
Use Google Search to verify if the claims, steps, or features described in the response actually exist and are accurate.
For example, if the AI describes a feature (like "EKS Auto Mode") or provides steps for something that does not exist or works completely differently, that IS a hallucination.

Return ONLY a JSON object with this exact structure, no markdown formatting, no code blocks, no other text:
{
  "is_hallucination": true or false
}`;

        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: judgePrompt }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        });

        let judgeResponseText = result.response.text();
        judgeResponseText = judgeResponseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const judgeData = JSON.parse(judgeResponseText);
        
        if (typeof judgeData.is_hallucination === 'boolean') {
          actual_hallucination = judgeData.is_hallucination;
        }
      } catch (e) {
        console.error('Error during LLM judgment with Gemini:', e);
        // Fallback to original flag
      }
    }

    const isCorrect = 
      (actual_hallucination && user_decision === 'hallucination') || 
      (!actual_hallucination && user_decision === 'factual');

    await db
      .insertInto('chat_hallucination_attempts')
      .values({
        user_id: userId,
        query,
        response,
        was_hallucinated: actual_hallucination ? 1 : 0,
        user_decision,
        user_reasoning,
        is_correct: isCorrect ? 1 : 0,
      } as NewChatHallucinationAttempt)
      .execute();

    return NextResponse.json({ success: true, is_correct: isCorrect, actual_hallucination });
  } catch (error: any) {
    console.error('Error submitting hallucination decision:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

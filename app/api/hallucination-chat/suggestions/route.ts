import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import OpenAI from 'openai';

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 500 });
    }

    const openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: apiKey,
      defaultHeaders: {
        'HTTP-Referer': process.env.AUTH_URL || 'http://localhost:3000',
        'X-Title': 'PhishGuard',
      }
    });
    
    const prompt = `Generate exactly 3 complex, specific, and factual questions that a user could ask an AI to test if the AI hallucinates.
The questions MUST be strictly related to ANY field of Computer Engineering (e.g., software engineering, hardware design, computer architecture, operating systems, embedded systems, networking, or artificial intelligence). 
DO NOT include questions about medical, history, biology, or other non-tech fields.
Do not use generic questions. Make them sound like a professional computer engineer, systems architect, or hardware engineer is asking.
Return ONLY a JSON array of strings. No markdown formatting, no code blocks, just the JSON array.
Example: ["How do I configure the OSPF totally stubby area on a Cisco Nexus 7000?", "What is the primary advantage of a Tomasulo's algorithm implementation with a reorder buffer over a simple scoreboard?"]`;

    const completion = await openai.chat.completions.create({
      model: 'meta-llama/llama-3.3-70b-instruct',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.9,
    });

    let text = completion.choices[0]?.message?.content || '[]';
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const suggestions = JSON.parse(text);

    return NextResponse.json({ suggestions });
  } catch (error: any) {
    console.error('Error generating suggestions:', error);
    return NextResponse.json({ error: 'Failed to generate suggestions', suggestions: [] }, { status: 500 });
  }
}

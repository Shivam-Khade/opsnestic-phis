import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import type { Metadata } from 'next';
import ChatClient from './ChatClient';

export const metadata: Metadata = { title: 'AI Chat Training' };

export default async function HallucinationChatPage() {
  const session = await auth();
  const userId = Number(session!.user!.id);
  
  const history = await db
    .selectFrom('chat_hallucination_attempts')
    .selectAll()
    .where('user_id', '=', userId)
    .orderBy('created_at', 'desc')
    .limit(50)
    .execute();

  return <ChatClient history={history} />;
}

'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function resetUserProgress() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  
  const userId = Number(session.user.id);

  // Delete all progress data for this user
  await db.deleteFrom('user_attempts').where('user_id', '=', userId).execute();
  await db.deleteFrom('user_performance').where('user_id', '=', userId).execute();
  await db.deleteFrom('user_skills').where('user_id', '=', userId).execute();
  await db.deleteFrom('training_sessions').where('user_id', '=', userId).execute();

  revalidatePath('/profile');
  revalidatePath('/dashboard');
  revalidatePath('/history');
}

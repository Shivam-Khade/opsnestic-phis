import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth/auth.config';

const { auth } = NextAuth(authConfig);

export async function middleware(req: NextRequest) {
  const session = await auth();
  const { pathname } = req.nextUrl;

  // Public routes — always accessible
  const publicRoutes = ['/login', '/register', '/api/auth'];
  if (pathname === '/' || publicRoutes.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // Unauthenticated → redirect to login
  if (!session?.user) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin routes — role check
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const role = (session.user as any).role;
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // Normal user routes — prevent admin access
  const normalUserRoutes = ['/dashboard', '/training', '/history', '/profile'];
  if (normalUserRoutes.some((r) => pathname.startsWith(r))) {
    const role = (session.user as any).role;
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/admin', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    // Enable server actions
  },
  // Security: ensure Gemini API key never reaches client
  env: {
    // Only expose non-sensitive env vars here
    // NEVER expose GEMINI_API_KEY, DATABASE_URL, NEXTAUTH_SECRET
  },
  // Server-only packages that should not be bundled into the client
  serverExternalPackages: ['mysql2', '@google/generative-ai', 'bcryptjs', 'kysely'],
};

export default nextConfig;

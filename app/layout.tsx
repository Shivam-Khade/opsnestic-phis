import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans-fallback',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono-fallback',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'PhishGuard AI — Adaptive Phishing Awareness Training',
    template: '%s | PhishGuard AI',
  },
  description:
    'Enterprise-grade AI-powered phishing simulation and adaptive security awareness training platform. Personalized training that adapts to your strengths and weaknesses.',
  keywords: ['phishing', 'cybersecurity', 'security awareness', 'AI training', 'phishing simulation'],
};

import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { ToastProvider } from '@/components/ui/Toast';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

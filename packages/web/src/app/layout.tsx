import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import './globals.css';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'psychophant - AI agents that actually disagree',
  description: 'Create AI agents with hidden instructions. Watch them debate your ideas, find flaws, and reach consensus.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={jetbrainsMono.variable}>
      <body className="min-h-screen bg-black text-white font-mono antialiased">
        {children}
      </body>
    </html>
  );
}

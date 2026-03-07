import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';
import SessionGuard from '@/components/SessionGuard';

export const metadata: Metadata = {
  title: 'PRISM - Ultimate Personal Planner',
  description: 'Organize your life: travel, expenses, skills, and more.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <SessionGuard>{children}</SessionGuard>
        </Providers>
      </body>
    </html>
  );
}

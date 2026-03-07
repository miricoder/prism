import type { Metadata } from 'next';
import './globals.css';

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
      <body>{children}</body>
    </html>
  );
}

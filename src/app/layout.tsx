import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { FirebaseClientProvider } from '@/firebase';
import { Inter } from 'next/font/google'
import { LiffProvider } from '@/firebase/liff-provider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })


export const metadata: Metadata = {
  title: 'SnipQueue',
  description: 'Intelligent appointment booking for modern barber shops.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <FirebaseClientProvider>
          <LiffProvider>
            {children}
          </LiffProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}

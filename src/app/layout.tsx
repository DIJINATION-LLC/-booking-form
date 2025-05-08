import './globals.css';
import { Inter } from 'next/font/google';
import ToastProvider from '@/components/ToastProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Texas Medical Clinic Booking',
  description: 'Book medical clinic rooms for your practice',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ToastProvider />
        <main>{children}</main>
      </body>
    </html>
  );
}

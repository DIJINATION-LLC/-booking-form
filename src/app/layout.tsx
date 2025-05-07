import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import ToastProvider from '@/components/ToastProvider';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TexasMed Healthcare Solutions",
  description: "Affordable Furnished Medical Office Space for Rent in McKinney, Texas",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navigation />
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}

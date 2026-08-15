import React from "react";
import type { Metadata } from "next";
import { Inter, Playfair_Display } from 'next/font/google'
import "./globals.css";

const inter = Inter({ subsets: ['latin'] })
const playfairDisplay = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair'
})

export const metadata: Metadata = {
  // Absolute base for og:image / twitter:image URLs in link previews.
  metadataBase: new URL('https://anniversary-one-taupe.vercel.app'),
  title: "Trin and Basti Adventures",
  description:
    'Our photo album — every adventure Trin and Basti have shared, one memory at a time.',
  openGraph: {
    title: 'Trin and Basti Adventures',
    description:
      'Our photo album — every adventure Trin and Basti have shared, one memory at a time.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${playfairDisplay.variable}`}>{children}</body>
    </html>
  );
} 
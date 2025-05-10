// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { EB_Garamond } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/ui/Navbar'; // Make sure this import exists

// Load EB Garamond font with medium weight
const ebGaramond = EB_Garamond({ 
  subsets: ['latin'],
  weight: ['500'],
  variable: '--font-eb-garamond',
});

// Your existing font setup
const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Llull - Memorize with Concept Maps',
  description: 'Enhance your memory with AI-generated concept maps',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if we're in development mode for debugging
  const isDev = process.env.NODE_ENV === 'development';
  
  return (
    <html lang="en">
      <body className={`${inter.className} ${ebGaramond.variable} ${isDev ? 'debug-mode' : ''}`}>
        <Navbar /> {/* Make sure this is here */}
        <main className="pt-16 bg-beige-50"> {/* Added beige background class */}
          {children}
        </main>
        {/* Debug info element */}
        <div className="debug-info">
          Font loaded: {ebGaramond.variable ? 'EB Garamond ✓' : 'EB Garamond ✗'}
        </div>
      </body>
    </html>
  );
}
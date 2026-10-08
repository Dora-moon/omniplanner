import type { Metadata } from 'next';
import './globals.css';
import { MusicProvider } from '@/context/MusicContext';
import { ToastContainer } from '@/ui/Toast';

export const metadata: Metadata = {
  title: 'OmniPlanner & Pixel AI Companion',
  description: 'Universal life management & calendar workspace with a pixel-art AI mascot companion.',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&family=Press+Start+2P&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <MusicProvider>{children}</MusicProvider>
        <ToastContainer />
      </body>
    </html>
  );
}


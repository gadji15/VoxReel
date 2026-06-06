import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ variable: '--font-inter', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'VoxReel — Turn Voice Stories into Cinematic Reels',
  description: 'The AI-powered cinematic storytelling studio. Record your voice, VoxReel renders premium vertical reels for TikTok, Instagram Reels, and YouTube Shorts.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  themeColor: '#07080A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} bg-background`}>
      <body className="font-sans antialiased bg-background text-foreground">
        {children}
      </body>
    </html>
  )
}

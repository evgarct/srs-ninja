export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Nav } from '@/components/nav'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({ subsets: ['latin', 'latin-ext', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'SRS Ninja',
  description: 'Personal spaced repetition for English and Czech',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <Nav />
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}

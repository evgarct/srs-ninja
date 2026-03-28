export const dynamic = 'force-dynamic'

import { Inter } from 'next/font/google'
import './globals.css'
import { Nav } from '@/components/nav'
import { Toaster } from '@/components/ui/sonner'
import { buildBrandMetadata, brandViewport } from '@/lib/brand'

const inter = Inter({ subsets: ['latin', 'latin-ext', 'cyrillic'] })
export const metadata = buildBrandMetadata()
export const viewport = brandViewport

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

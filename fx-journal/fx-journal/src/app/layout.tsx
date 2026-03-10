import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FX Journal — Terminal Pro',
  description: 'Professional FX Trading Journal',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

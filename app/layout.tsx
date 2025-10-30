// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AlumniConnect - Bridging Graduates, Building Futures',
  description: 'Reconnect with your alma mater, discover career opportunities, mentor students, and make a lasting impact on your community.',
  keywords: 'alumni, network, career, mentorship, community, graduates',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-white dark:bg-gray-900">
          {children}
        </div>
      </body>
    </html>
  )
}
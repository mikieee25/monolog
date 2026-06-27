import type { Metadata, Viewport } from 'next'
import { Inter, Geist } from 'next/font/google'
import './globals.css'
import { QueryProvider } from '@/providers/query-provider'
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Monolog',
  description: 'Personal expense tracker',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Monolog',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#09090b',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={cn("dark", "font-sans", geist.variable)}>

      <body className={`${inter.variable} font-sans antialiased bg-[#05050A] text-zinc-50`}>
        {/* Ambient Blurred Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-[#05050A]">
          <div className="absolute top-[-10%] left-[-20%] md:left-[-10%] w-[80%] md:w-[50%] aspect-square rounded-full bg-zinc-600/10 md:bg-zinc-600/10 blur-[100px] md:blur-[120px]" />
          <div className="absolute bottom-[20%] right-[-20%] md:right-[-10%] w-[80%] md:w-[50%] aspect-square rounded-full bg-zinc-500/10 md:bg-zinc-500/10 blur-[100px] md:blur-[120px]" />
        </div>

        <QueryProvider>
          {/* Responsive shell */}
          <div className="mx-auto w-full max-w-sm md:max-w-4xl lg:max-w-5xl min-h-dvh relative">
            {children}
          </div>
        </QueryProvider>
      </body>
    </html>
  )
}

import type { Metadata, Viewport } from 'next'
import { Inter, Geist } from 'next/font/google'
import './globals.css'
import { QueryProvider } from '@/providers/query-provider'
import { cn } from "@/lib/utils";
import { ThemeProvider } from '@/providers/theme-provider'
import { Toaster } from '@/components/ui/sonner'

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
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body className={`${inter.variable} font-sans antialiased bg-zinc-50 dark:bg-[#05050A] text-zinc-900 dark:text-zinc-50`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange={false}
        >
          {/* Ambient Blurred Background Elements */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
            <div className="absolute top-[-5%] left-[-10%] w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-indigo-500/20 md:bg-indigo-500/10 rounded-full blur-[80px] md:blur-[120px] mix-blend-screen" />
            <div className="absolute bottom-[-5%] right-[-10%] w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-purple-500/20 md:bg-purple-500/10 rounded-full blur-[80px] md:blur-[100px] mix-blend-screen" />
          </div>

          <QueryProvider>
            <div className="mx-auto w-full max-w-sm md:max-w-4xl lg:max-w-5xl min-h-dvh relative">
              {children}
            </div>
          </QueryProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}

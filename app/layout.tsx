import type { Metadata } from "next"
import { Fira_Code, Lora, Poppins } from "next/font/google"

import "./globals.css"

import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { appConfig } from "@/lib/config"
import { cn } from "@/lib/utils"

const fontSans = Poppins({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
})

const fontSerif = Lora({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600", "700"],
})

const fontMono = Fira_Code({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
})

export const metadata: Metadata = {
  metadataBase: new URL(appConfig.externalUrls.production),
  title: "MinuteBloom - AI Meeting Summarizer",
  description:
    "Upload a meeting recording and turn it into a timestamped transcript, clear decisions, and action-ready notes.",
  applicationName: appConfig.name,
  keywords: [
    "meeting summarizer",
    "meeting transcript",
    "action items",
    "AI transcription",
    "Supabase",
    "Next.js",
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={cn(
        "scroll-smooth antialiased",
        fontSans.variable,
        fontSerif.variable,
        fontMono.variable
      )}
    >
      <body className="min-h-screen bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster
            richColors
            closeButton
            toastOptions={{
              classNames: {
                toast:
                  "border-2 border-border bg-card text-card-foreground shadow-[var(--shadow)]",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}

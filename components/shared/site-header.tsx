"use client"

import Link from "next/link"
import { Menu, X } from "lucide-react"
import { useState } from "react"

import { Logo } from "@/components/shared/logo"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { Button, buttonVariants } from "@/components/ui/button"
import { appConfig } from "@/lib/config"
import { cn } from "@/lib/utils"

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-sm">
      <div className="content-width flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="MinuteBloom home">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-6 lg:flex">
          {appConfig.navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <ThemeToggle />
          <Link
            href="/sign-in"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            Sign in
          </Link>
          <Link
            href="/app/meetings/new"
            className={buttonVariants({ size: "sm" })}
          >
            Summarize a meeting
          </Link>
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      <div
        className={cn(
          "border-t border-border bg-background px-4 transition-[grid-template-rows,opacity] duration-200 lg:hidden",
          open
            ? "grid grid-rows-[1fr] opacity-100"
            : "grid grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="content-width flex flex-col gap-4 py-4 sm:px-2">
            {appConfig.navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="flex flex-col gap-3 pt-2">
              <Link
                href="/sign-in"
                onClick={() => setOpen(false)}
                className={buttonVariants({ variant: "ghost" })}
              >
                Sign in
              </Link>
              <Link
                href="/app/meetings/new"
                onClick={() => setOpen(false)}
                className={buttonVariants({})}
              >
                Summarize a meeting
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

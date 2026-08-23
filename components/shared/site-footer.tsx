import Link from "next/link"

import { appConfig } from "@/lib/config"

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-card/70">
      <div className="content-width flex flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <p className="font-semibold text-foreground">{appConfig.name}</p>
          <p>{appConfig.tagline}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/demo" className="hover:text-foreground">
            Sample workspace
          </Link>
          <Link href="/sign-in" className="hover:text-foreground">
            Sign in
          </Link>
          <Link
            href={appConfig.externalUrls.github}
            className="hover:text-foreground"
          >
            Repository target
          </Link>
        </div>
      </div>
    </footer>
  )
}

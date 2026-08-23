import Link from "next/link"
import { Home, PlusCircle, Settings2 } from "lucide-react"

import { Logo } from "@/components/shared/logo"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { buttonVariants } from "@/components/ui/button"

const navItems = [
  { href: "/app", label: "Dashboard", icon: Home },
  { href: "/app/meetings/new", label: "New meeting", icon: PlusCircle },
  { href: "/app/settings", label: "Settings", icon: Settings2 },
]

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-b-2 border-border bg-card/60 lg:border-r-2 lg:border-b-0">
          <div className="flex items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:flex-col lg:items-start lg:px-5">
            <Logo />
            <ThemeToggle />
          </div>
          <nav className="grid gap-2 px-4 pb-5 sm:px-6 lg:px-5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={buttonVariants({
                  variant: "ghost",
                }).concat("justify-start")}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="section-padding px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}

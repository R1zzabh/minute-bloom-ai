import { Flower2 } from "lucide-react"

import { cn } from "@/lib/utils"

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-border bg-accent shadow-[var(--shadow)]">
        <Flower2 className="h-5 w-5 text-foreground" />
      </div>
      <div>
        <div className="font-semibold tracking-tight">MinuteBloom</div>
        <div className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground uppercase">
          meetings to momentum
        </div>
      </div>
    </div>
  )
}

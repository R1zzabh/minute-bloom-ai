"use client"

import type { ComponentProps } from "react"
import { Toaster as SonnerToaster } from "sonner"

export function Toaster(props: ComponentProps<typeof SonnerToaster>) {
  return (
    <SonnerToaster position="top-right" expand visibleToasts={5} {...props} />
  )
}

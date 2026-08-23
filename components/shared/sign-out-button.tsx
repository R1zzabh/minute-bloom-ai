"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { Button, type ButtonProps } from "@/components/ui/button"

export function SignOutButton(props: ButtonProps) {
  const router = useRouter()

  async function handleClick() {
    try {
      const supabase = createBrowserSupabaseClient()
      const { error } = await supabase.auth.signOut()

      if (error) {
        throw error
      }

      router.push("/")
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to sign out."
      )
    }
  }

  return <Button {...props} onClick={handleClick} />
}

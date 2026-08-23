"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { appConfig } from "@/lib/config"

export function SignInForm({ disabled }: { disabled: boolean }) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (disabled) {
      toast.error("Supabase credentials are required to enable sign-in.")
      return
    }

    setPending(true)

    try {
      const supabase = createBrowserSupabaseClient()
      const redirectOrigin =
        process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${redirectOrigin}/auth/callback?next=/app`,
        },
      })

      if (error) {
        throw error
      }

      toast.success("Check your email for the MinuteBloom sign-in link.")
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to start sign-in."
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="mb-2 block text-sm font-medium" htmlFor="email">
          Work email
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={`team@${appConfig.name.toLowerCase()}.ai`}
          required
        />
      </div>
      <Button className="w-full" disabled={pending}>
        {pending ? "Sending sign-in link..." : "Continue with email"}
      </Button>
    </form>
  )
}

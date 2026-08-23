"use server"

import { redirect } from "next/navigation"

import {
  clearServerSupabaseAuthCookies,
  createServerSupabaseClient,
} from "@/lib/supabase/server"

export async function signOutAction() {
  try {
    const supabase = await createServerSupabaseClient()
    await supabase.auth.signOut({ scope: "local" })
  } catch {
    // Redirect the user even when the session is already gone.
  }

  try {
    await clearServerSupabaseAuthCookies()
  } catch {
    // Avoid leaking server auth details back into the UI.
  }

  redirect("/sign-in?signed_out=1")
}

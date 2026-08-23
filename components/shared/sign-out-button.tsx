"use client"

import { useFormStatus } from "react-dom"

import { signOutAction } from "@/app/(workspace)/app/actions"
import { Button, type ButtonProps } from "@/components/ui/button"

function SubmitButton({
  children,
  ...props
}: ButtonProps & { children?: React.ReactNode }) {
  const { pending } = useFormStatus()

  return (
    <Button {...props} type="submit" disabled={pending || props.disabled}>
      {pending ? "Signing out..." : children}
    </Button>
  )
}

export function SignOutButton({
  children = "Sign out",
  ...props
}: ButtonProps) {
  return (
    <form action={signOutAction}>
      <SubmitButton {...props}>{children}</SubmitButton>
    </form>
  )
}

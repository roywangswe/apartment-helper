import Link from "next/link"
import { redirect } from "next/navigation"
import { AuthError } from "next-auth"

import { signIn } from "@/lib/auth"
import { LoginForm } from "./login-form"

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  async function handleLogin(prevState: any, formData: FormData) {
    "use server"

    console.log("========================================")
    console.log("LOGIN PAGE - HANDLE LOGIN")
    console.log("========================================")

    const email = formData.get("email") as string
    const password = formData.get("password") as string

    console.log("Email:", email)
    console.log("Password present:", !!password)
    console.log("Password length:", password?.length)

    if (!email || !password) {
      console.log("ERROR: Missing email or password")
      return {
        error: "Please provide both email and password"
      }
    }

    console.log("Calling signIn()...")

    try {
      await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      console.log("SignIn successful")
      console.log("========================================")
    } catch (error) {
      console.error("========================================")
      console.error("LOGIN PAGE - SIGNIN ERROR")
      console.error("========================================")
      console.error("Error type:", error?.constructor?.name)
      console.error("Error message:", error instanceof Error ? error.message : String(error))

      // Check if it's an AuthError (failed credentials)
      if (error instanceof AuthError) {
        console.error("AuthError type:", error.type)
        console.error("========================================")
        return {
          error: "Invalid email or password"
        }
      }

      console.error("Unexpected error:", error)
      console.error("========================================")
      return {
        error: "An unexpected error occurred. Please try again."
      }
    }

    // If we get here, login was successful - redirect to dashboard
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md">
        <div>
          <h1 className="text-center text-3xl font-bold tracking-tight text-gray-900">
            Sign in to your account
          </h1>
        </div>

        <LoginForm handleLogin={handleLogin} />

        <p className="text-center text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
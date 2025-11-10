import Link from "next/link"

import { signIn } from "@/lib/auth"

export default function LoginPage() {
  async function handleLogin(formData: FormData) {
    "use server"

    console.log("========================================")
    console.log("LOGIN PAGE - HANDLE LOGIN")
    console.log("========================================")

    const email = formData.get("email") as string
    const password = formData.get("password") as string

    console.log("Email:", email)
    console.log("Password present:", !!password)
    console.log("Password length:", password?.length)

    console.log("Calling signIn()...")

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirectTo: "/dashboard"
      })
      console.log("SignIn result:", result)
      console.log("========================================")
    } catch (error) {
      console.error("========================================")
      console.error("LOGIN PAGE - SIGNIN ERROR")
      console.error("========================================")
      console.error("Error type:", error?.constructor?.name)
      console.error("Error message:", error instanceof Error ? error.message : String(error))
      console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")
      console.error("Full error:", error)
      console.error("========================================")
      throw error
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form action={handleLogin} className="w-full max-w-md space-y-4 p-8">
        <h1 className="text-2xl font-bold">Login</h1>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Sign In
        </button>

        <p className="text-center text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-blue-600 hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  )
}
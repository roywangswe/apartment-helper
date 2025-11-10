import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export default async function HomePage() {
  console.log("========================================")
  console.log("HOME PAGE - START")
  console.log("========================================")
  console.log("Calling auth()...")

  let session
  try {
    session = await auth()
    console.log("Auth successful")
    console.log("Session:", JSON.stringify(session, null, 2))
    console.log("Session present:", !!session)
    console.log("Session user:", session?.user)
  } catch (error) {
    console.error("========================================")
    console.error("HOME PAGE - AUTH ERROR")
    console.error("========================================")
    console.error("Error type:", error?.constructor?.name)
    console.error("Error message:", error instanceof Error ? error.message : String(error))
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")
    console.error("Full error:", error)
    console.error("========================================")
    throw error
  }

  if (session) {
    console.log("Session exists - redirecting to /dashboard")
    console.log("========================================")
    redirect("/dashboard")
  }

  console.log("No session - redirecting to /login")
  console.log("========================================")
  redirect("/login")
}
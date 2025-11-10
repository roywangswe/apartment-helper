import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import ChicagoMapClient from "@/components/ChicagoMapClient"

export default async function DashboardPage() {
  const session = await auth()

  console.log("========================================")
  console.log("DASHBOARD PAGE")
  console.log("========================================")
  console.log("Session:", !!session)
  console.log("User:", session?.user)
  console.log("========================================")

  if (!session?.user) {
    console.log("No session - redirecting to login")
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={session.user} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back{session.user.name ? `, ${session.user.name}` : ""}!
          </h1>
          <p className="mt-2 text-gray-600">
            Here's what's happening with your apartments today.
          </p>
        </div>

        {/* Map */}
        <ChicagoMapClient />
      </main>
    </div>
  )
}

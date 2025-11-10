import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: "/login"
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      console.log("========================================")
      console.log("AUTHORIZED CALLBACK")
      console.log("========================================")
      console.log("Path:", nextUrl.pathname)
      console.log("Auth object present:", !!auth)
      console.log("Auth user present:", !!auth?.user)
      console.log("Auth user:", JSON.stringify(auth?.user, null, 2))

      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard")

      console.log("Is logged in:", isLoggedIn)
      console.log("Is on dashboard:", isOnDashboard)

      if (isOnDashboard) {
        console.log("Dashboard access - returning:", isLoggedIn)
        console.log("========================================")
        return isLoggedIn
      }

      console.log("Non-dashboard access - returning: true")
      console.log("========================================")
      return true
    },
    async jwt({ token, user }) {
      console.log("========================================")
      console.log("JWT CALLBACK")
      console.log("========================================")
      console.log("Token present:", !!token)
      console.log("User present:", !!user)
      console.log("Token:", JSON.stringify(token, null, 2))
      console.log("User:", JSON.stringify(user, null, 2))

      if (user) {
        token.id = user.id
      }

      console.log("Returning token:", JSON.stringify(token, null, 2))
      console.log("========================================")
      return token
    },
    async session({ session, token }) {
      console.log("========================================")
      console.log("SESSION CALLBACK")
      console.log("========================================")
      console.log("Session present:", !!session)
      console.log("Token present:", !!token)
      console.log("Session:", JSON.stringify(session, null, 2))
      console.log("Token:", JSON.stringify(token, null, 2))

      if (token && session.user) {
        session.user.id = token.id as string
      }

      console.log("Returning session:", JSON.stringify(session, null, 2))
      console.log("========================================")
      return session
    }
  },
  providers: []
} satisfies NextAuthConfig

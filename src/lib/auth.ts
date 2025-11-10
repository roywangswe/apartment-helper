import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

import { authConfig } from "./auth-config"
import { prisma } from "./db"

// DEBUG: Log environment variables status
console.log("========================================")
console.log("AUTH.TS INITIALIZATION")
console.log("========================================")
console.log("DATABASE_URL present:", !!process.env.DATABASE_URL)
console.log("DATABASE_URL length:", process.env.DATABASE_URL?.length || 0)
console.log("AUTH_SECRET present:", !!process.env.AUTH_SECRET)
console.log("AUTH_SECRET length:", process.env.AUTH_SECRET?.length || 0)
console.log("NEXTAUTH_URL:", process.env.NEXTAUTH_URL || "NOT SET")
console.log("NEXTAUTH_SECRET present:", !!process.env.NEXTAUTH_SECRET)
console.log("NODE_ENV:", process.env.NODE_ENV)
console.log("VERCEL:", process.env.VERCEL)
console.log("========================================")

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  debug: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      authorize: async (credentials) => {
        console.log("========================================")
        console.log("AUTHORIZE CALLED")
        console.log("========================================")
        console.log("Credentials present:", !!credentials)
        console.log("Email present:", !!credentials?.email)
        console.log("Password present:", !!credentials?.password)
        console.log("Email value:", credentials?.email)

        try {
          if (!credentials?.email || !credentials?.password) {
            console.log("ERROR: Missing credentials")
            return null
          }

          console.log("Attempting to find user in database...")
          console.log("Prisma client available:", !!prisma)

          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string }
          })

          console.log("User found:", !!user)
          if (user) {
            console.log("User ID:", user.id)
            console.log("User email:", user.email)
            console.log("User has password:", !!user.password)
            console.log("User password length:", user.password?.length)
          }

          if (!user) {
            console.log("ERROR: No user found with email:", credentials.email)
            return null
          }

          console.log("Comparing passwords...")
          const passwordMatch = await bcrypt.compare(
            credentials.password as string,
            user.password
          )

          console.log("Password match:", passwordMatch)

          if (!passwordMatch) {
            console.log("ERROR: Password does not match")
            return null
          }

          const returnUser = {
            id: user.id,
            email: user.email,
            name: user.name
          }

          console.log("SUCCESS: Returning user:", returnUser)
          console.log("========================================")
          return returnUser
        } catch (error) {
          console.error("========================================")
          console.error("AUTHORIZE ERROR:")
          console.error("Error type:", error?.constructor?.name)
          console.error("Error message:", error instanceof Error ? error.message : String(error))
          console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")
          console.error("========================================")
          throw error
        }
      }
    }),
    ...authConfig.providers
  ]
})

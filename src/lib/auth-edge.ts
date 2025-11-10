import NextAuth from "next-auth"

import { authConfig } from "./auth-config"

console.log("========================================")
console.log("AUTH-EDGE.TS INITIALIZATION")
console.log("========================================")
console.log("AUTH_SECRET present:", !!process.env.AUTH_SECRET)
console.log("AUTH_SECRET length:", process.env.AUTH_SECRET?.length || 0)
console.log("NEXTAUTH_URL:", process.env.NEXTAUTH_URL || "NOT SET")
console.log("NEXTAUTH_SECRET present:", !!process.env.NEXTAUTH_SECRET)
console.log("NODE_ENV:", process.env.NODE_ENV)
console.log("VERCEL:", process.env.VERCEL)
console.log("========================================")

export const { auth } = NextAuth(authConfig)

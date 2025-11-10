import { PrismaClient } from '@prisma/client'

console.log("========================================")
console.log("DB.TS INITIALIZATION")
console.log("========================================")
console.log("DATABASE_URL present:", !!process.env.DATABASE_URL)
console.log("DATABASE_URL length:", process.env.DATABASE_URL?.length || 0)
console.log("DATABASE_URL preview:", process.env.DATABASE_URL?.substring(0, 30) + "...")
console.log("NODE_ENV:", process.env.NODE_ENV)
console.log("========================================")

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

console.log("Creating Prisma client...")
console.log("Existing prisma client:", !!globalForPrisma.prisma)

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

console.log("Prisma client created successfully")

// Test database connection
prisma.$connect()
  .then(() => {
    console.log("========================================")
    console.log("DATABASE CONNECTION SUCCESS")
    console.log("========================================")
  })
  .catch((error) => {
    console.error("========================================")
    console.error("DATABASE CONNECTION FAILED")
    console.error("========================================")
    console.error("Error type:", error?.constructor?.name)
    console.error("Error message:", error instanceof Error ? error.message : String(error))
    console.error("Error code:", error?.code)
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")
    console.error("========================================")
  })

if (process.env.NODE_ENV !== 'production') {
  console.log("Development mode - storing prisma in global")
  globalForPrisma.prisma = prisma
}
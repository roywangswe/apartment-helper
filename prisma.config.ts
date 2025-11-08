import { defineConfig } from "prisma/config";

const FALLBACK_DATABASE_URL =
  "postgresql://placeholder:placeholder@localhost:5432/placeholder";

const databaseUrl = process.env.DATABASE_URL ?? FALLBACK_DATABASE_URL;

if (!process.env.DATABASE_URL) {
  console.warn(
    "DATABASE_URL is not set; using a placeholder connection string to allow Prisma code generation."
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: databaseUrl,
  },
});

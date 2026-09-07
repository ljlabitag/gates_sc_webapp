import { defineConfig } from "drizzle-kit";

// drizzle-kit only generates the SQL migration files here — applying them to
// D1 (local and remote) goes through `wrangler d1 migrations apply`, which
// keeps its own migration-tracking table and is the supported path for D1.
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "../drizzle/migrations",
});

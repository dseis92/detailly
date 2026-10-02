import { migrate } from "drizzle-orm/postgres-js/migrator";
import {
  closeDatabase,
  getDatabase
} from "../src/infrastructure/database/client";

async function main(): Promise<void> {
  await migrate(getDatabase(), { migrationsFolder: "drizzle" });
  await closeDatabase();
  console.info("Database migrations applied successfully.");
}

main().catch(async (error: unknown) => {
  console.error("Database migration failed.", error);
  await closeDatabase();
  process.exitCode = 1;
});

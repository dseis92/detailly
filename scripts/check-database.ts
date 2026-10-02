import {
  checkDatabase,
  closeDatabase
} from "../src/infrastructure/database/client";

async function main(): Promise<void> {
  const result = await checkDatabase();
  await closeDatabase();
  if (!result.ok) {
    throw new Error("Database readiness check failed.");
  }
  console.info("Database readiness check passed.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getServerEnv } from "@/lib/config/env";
import * as schema from "./schema";

let client: ReturnType<typeof postgres> | undefined;

function getClient(): ReturnType<typeof postgres> {
  client ??= postgres(getServerEnv().DATABASE_URL, {
    max: 5,
    connect_timeout: 3,
    idle_timeout: 20,
    prepare: false
  });
  return client;
}

export function getDatabase() {
  return drizzle(getClient(), { schema });
}

export async function checkDatabase(): Promise<{ ok: boolean }> {
  try {
    await getClient()`select 1`;
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.end();
    client = undefined;
  }
}

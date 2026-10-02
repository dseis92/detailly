import { checkDatabase } from "@/infrastructure/database/client";
import { logger } from "@/infrastructure/observability/logger";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const startedAt = performance.now();
  const database = await checkDatabase();
  const status = database.ok ? "ok" : "degraded";
  const statusCode = database.ok ? 200 : 503;

  logger.info("health.checked", {
    status,
    database: database.ok ? "up" : "down",
    durationMs: Math.round(performance.now() - startedAt)
  });

  return Response.json(
    {
      status,
      service: "detailly-web",
      checks: {
        database: database.ok ? "up" : "down"
      }
    },
    {
      status: statusCode,
      headers: { "Cache-Control": "no-store" }
    }
  );
}

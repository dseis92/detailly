import { logger } from "@/infrastructure/observability/logger";

export async function register(): Promise<void> {
  logger.info("application.started", {
    runtime: process.env.NEXT_RUNTIME ?? "nodejs"
  });
}

export async function onRequestError(
  error: { digest?: string } & Error,
  request: { path: string; method: string },
  context: { routerKind: string; routeType: string }
): Promise<void> {
  logger.error("request.failed", {
    errorName: error.name,
    digest: error.digest ?? null,
    method: request.method,
    path: request.path,
    routerKind: context.routerKind,
    routeType: context.routeType
  });
}

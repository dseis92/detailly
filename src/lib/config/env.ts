import { z } from "zod";

export const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  APP_BASE_URL: z.url().default("http://localhost:3000"),
  APP_NAME: z.string().trim().min(1).default("Detailly"),
  APP_DEFAULT_LOCALE: z.string().trim().min(2).default("en-US"),
  APP_DEFAULT_CURRENCY: z
    .string()
    .regex(/^[A-Z]{3}$/)
    .default("USD"),
  BUSINESS_TIMEZONE: z
    .string()
    .refine(isTimeZone, "Must be a valid IANA timezone")
    .default("America/Chicago"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ })
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseServerEnv(
  input: Record<string, string | undefined>
): ServerEnv {
  return serverEnvSchema.parse(input);
}

let cachedEnv: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  cachedEnv ??= parseServerEnv(process.env);
  return cachedEnv;
}

function isTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

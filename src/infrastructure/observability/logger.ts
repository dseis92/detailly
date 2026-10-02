type LogLevel = "info" | "warn" | "error";
type LogContext = Readonly<Record<string, boolean | number | string | null>>;

function write(level: LogLevel, event: string, context: LogContext = {}): void {
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...context
  });

  if (level === "error") {
    console.error(entry);
  } else if (level === "warn") {
    console.warn(entry);
  } else {
    console.info(entry);
  }
}

export const logger = {
  info: (event: string, context?: LogContext) => write("info", event, context),
  warn: (event: string, context?: LogContext) => write("warn", event, context),
  error: (event: string, context?: LogContext) => write("error", event, context)
};

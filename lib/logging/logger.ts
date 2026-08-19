export type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, string | number | boolean | null | undefined>;

function write(level: LogLevel, message: string, context: LogContext = {}) {
  const safeContext = Object.fromEntries(
    Object.entries(context).filter(([key]) => !/key|token|secret|password|cookie/i.test(key)),
  );
  const entry = JSON.stringify({ timestamp: new Date().toISOString(), level, message, ...safeContext });
  if (level === "error") console.error(entry);
  else if (level === "warn") console.warn(entry);
  else console.log(entry);
}

export const logger = {
  debug: (message: string, context?: LogContext) => write("debug", message, context),
  info: (message: string, context?: LogContext) => write("info", message, context),
  warn: (message: string, context?: LogContext) => write("warn", message, context),
  error: (message: string, context?: LogContext) => write("error", message, context),
};
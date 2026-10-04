export function safeInternalPath(
  path: string | null | undefined,
  fallback = "/account"
): string {
  if (!path?.startsWith("/") || path.startsWith("//") || path.includes("\\")) {
    return fallback;
  }
  const destination = new URL(path, "https://detailly.invalid");
  return destination.origin === "https://detailly.invalid"
    ? `${destination.pathname}${destination.search}${destination.hash}`
    : fallback;
}

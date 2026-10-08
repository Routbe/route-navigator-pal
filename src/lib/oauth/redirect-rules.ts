/** Validates a callback URL before it is added to an app (pure, testable). */
export function redirectError(uri: string, existing: string[]): string | null {
  let u: URL;
  try { u = new URL(uri); } catch { return "Geen geldige URL."; }
  const local = u.hostname === "localhost" || u.hostname === "127.0.0.1";
  if (u.protocol !== "https:" && !(local && u.protocol === "http:")) return "Gebruik https (http enkel voor localhost).";
  if (u.hash) return "Een redirect mag geen #fragment bevatten.";
  if (existing.includes(uri)) return "Deze URL staat al in de lijst.";
  return null;
}

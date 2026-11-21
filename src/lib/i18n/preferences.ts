export const DEFAULT_LANGUAGE = "en" as const;
export function resolveLanguage(saved: string | null): "ar" | "en" {
  return saved === "en" || saved === "ar" ? saved : DEFAULT_LANGUAGE;
}
import en from "./en";
import zhCN from "./zh-CN";

export type SourceLocale = "en" | "zh-CN";
export function sourceLocale(locale: string): SourceLocale {
  return locale.toLowerCase().replace("_", "-").startsWith("zh") ? "zh-CN" : "en";
}
function lookup(table: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) =>
    value !== null && typeof value === "object" && Object.prototype.hasOwnProperty.call(value, key)
      ? (value as Record<string, unknown>)[key] : undefined, table);
}
/** Source-owned base translation namespace, with React text interpolation. */
export function createSourceTranslate(locale: string) {
  const language = sourceLocale(locale), table = language === "zh-CN" ? zhCN : en;
  const plural = new Intl.PluralRules(language);
  return (key: string, values: Readonly<Record<string, string | number>> = {}): string => {
    const count = typeof values.count === "number" ? values.count : null;
    const variant = count === null ? key : key + "_" + plural.select(count);
    const value = lookup(table, variant) ?? lookup(table, key) ?? lookup(en, variant) ?? lookup(en, key);
    if (typeof value !== "string") return key;
    return value.replace(/\{\{\s*([^},\s]+)(?:,[^}]*)?\s*\}\}/g, (token, name: string) =>
      Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : token);
  };
}

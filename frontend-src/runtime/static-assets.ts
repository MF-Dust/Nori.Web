/** Only these immutable resource trees are mirrored; APIs and other assets stay local. */
export const STATIC_ASSET_PREFIXES = ["/ARGNori_web/", "/Nori_web/", "/fonts/", "/ocean/", "/cubism_sdk/"];

declare const __NORI_STATIC_ORIGIN__: string;
export const staticAssetOrigin = typeof __NORI_STATIC_ORIGIN__ === "undefined" ? "" : __NORI_STATIC_ORIGIN__;

export function normalizeStaticOrigin(value: string): string {
  if (!value.trim()) return "";
  const url = new URL(value.trim());
  if (!/^https?:$/.test(url.protocol) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("NORI_STATIC_ORIGIN must be an HTTP(S) origin without a path, credentials, query or fragment");
  }
  return url.origin;
}

export function staticAssetUrl(path: string, origin = staticAssetOrigin): string {
  return origin && (path === "/fonts.css" || STATIC_ASSET_PREFIXES.some((prefix) => path.startsWith(prefix)))
    ? origin + path : path;
}

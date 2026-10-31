var CACHE_NAME = "arcade-assets-v1";
var ASSET_LOADER_HEADER = "x-asset-loader";

var CATEGORIES = ["boot", "onDemand", "desktop", "datasea", "farewell"];
var PATTERNS = {
  boot: [
    "/cubism_sdk/Core/live2dcubismcore.js",
    "/ARGNori_web/**",
    "/ocean/**",
    "/icon.png",
  ],
  // These are still cached when requested, but never block the boot gate.
  onDemand: [
    "/fonts/**",
    "/inori-logo.png",
    "/app-icons/**",
    "/audio/sfx/**",
    "/audio/cold-open/**",
    "/audio/corruption/**",
    "/cakeduel/**",
    "/audio/cakeduel/**",
    "/audio/chess/**",
    "/pictionary/**",
    "/assets/**",
  ],
  desktop: [
    "/audio/bgm1.m4a",
    "/audio/nori_daily_manifold.mp3",
    "/audio/bgm_void.m4a",
    "/audio/memory/**",
  ],
  datasea: ["/datasea/**", "/audio/datasea/**"],
  farewell: ["/Nori_web/**", "/audio/arg-finale/*.wav", "/audio/bgm_memory.mp3"],
};

var ESCAPE_CHARS = new Set(String.raw`\^$.|?+()[]{}`);
function globToRegex(pattern) {
  let regexStr = "^";
  for (let i = 0; i < pattern.length; i++) {
    let char = pattern[i];
    if (char === "*") {
      if (pattern[i + 1] === "*") {
        regexStr += ".*";
        i++;
      } else {
        regexStr += "[^/]*";
      }
    } else if (ESCAPE_CHARS.has(char)) {
      regexStr += `\\${char}`;
    } else {
      regexStr += char;
    }
  }
  return new RegExp(`${regexStr}$`);
}

var COMPILED_BUCKETS = CATEGORIES.map((id) => ({
  id,
  regexps: PATTERNS[id].map(globToRegex),
}));

function shouldCache(pathname) {
  for (let { regexps } of COMPILED_BUCKETS) {
    if (regexps.some((r) => r.test(pathname))) return true;
  }
  return false;
}

var sw = self;
var staticOrigin = new URL(sw.location.href).searchParams.get("staticOrigin");
var staticPrefixes = ["/ARGNori_web/", "/Nori_web/", "/fonts/", "/ocean/", "/cubism_sdk/"];

sw.addEventListener("install", () => {
  sw.skipWaiting();
});

sw.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => sw.clients.claim()),
  );
});

sw.addEventListener("fetch", (event) => {
  let { request } = event;
  if (request.method !== "GET") return;
  if (request.headers.has(ASSET_LOADER_HEADER) || request.cache === "no-store") return;
  if (request.headers.has("range")) return;

  let url = new URL(request.url);
  var remote = url.origin !== sw.location.origin;
  if (remote && (url.origin !== staticOrigin || !staticPrefixes.some((prefix) => url.pathname.startsWith(prefix)))) return;
  var key = remote ? url.href : url.pathname;
  if (url.pathname.startsWith("/api/")) return;
  if (!shouldCache(url.pathname)) return;

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(key).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            cache.put(key, response.clone());
          }
          return response;
        });
      }),
    ),
  );
});

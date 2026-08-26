import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "public");
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".m4a": "audio/mp4",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".glb": "model/gltf-binary",
  ".moc3": "application/octet-stream",
  ".worklet": "application/javascript; charset=utf-8"
};

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const relative = decoded.replace(/^\/+/, "");
  const candidate = path.resolve(root, relative || "index.html");
  return candidate.startsWith(root + path.sep) || candidate === root ? candidate : null;
}

function sendJson(res, status, body) {
  const text = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Content-Length": Buffer.byteLength(text)
  });
  res.end(text);
}

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,HEAD,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
    res.end();
    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  const pathname = new URL(req.url, `http://${req.headers.host || "localhost"}`).pathname;
  if (pathname === "/api/entry-status") {
    sendJson(res, 200, { status: "ok", mode: "offline" });
    return;
  }
  if (pathname.startsWith("/api/")) {
    sendJson(res, 503, { error: "This archive has no cloud backend", mode: "offline" });
    return;
  }

  const direct = safePath(pathname);
  let file = direct && fs.existsSync(direct) && fs.statSync(direct).isFile() ? direct : null;
  if (!file) file = path.join(root, "index.html");
  if (!fs.existsSync(file)) {
    sendJson(res, 404, { error: "Not found" });
    return;
  }

  const stat = fs.statSync(file);
  res.writeHead(200, {
    "Content-Type": mime[path.extname(file).toLowerCase()] || "application/octet-stream",
    "Content-Length": stat.size,
    "Cache-Control": path.extname(file) === ".html" ? "no-cache" : "public, max-age=31536000, immutable",
    "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; worker-src 'self' blob:; frame-src 'self';",
    "Accept-Ranges": "bytes"
  });
  if (req.method === "HEAD") res.end();
  else fs.createReadStream(file).pipe(res);
});

server.listen(port, host, () => {
  console.log(`NoriOS offline archive: http://${host}:${port}`);
  console.log(`Serving: ${root}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => server.close(() => process.exit(0)));
}

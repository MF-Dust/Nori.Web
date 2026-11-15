/** A reliable, ordered, message-oriented link between exactly two browsers. */
export type PeerLinkState = "connecting" | "open" | "closed" | "failed";

/** How the bytes travel, reported once the link is up. */
export type PeerRoute = "direct" | "relay" | "easytier" | "unknown";

export interface PeerLink {
  readonly transport: "webrtc" | "easytier";
  readonly state: PeerLinkState;
  readonly route: PeerRoute;
  send(message: string): void;
  onMessage(listener: (message: string) => void): () => void;
  onState(listener: (state: PeerLinkState) => void): () => void;
  close(): void;
}

/** Small listener set shared by the transports and the session. */
export class Emitter<T> {
  private listeners = new Set<(value: T) => void>();
  on(listener: (value: T) => void): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }
  emit(value: T) {
    for (const listener of [...this.listeners]) {
      try { listener(value); } catch (error) { console.error("[multiplayer]", error); }
    }
  }
  clear() { this.listeners.clear(); }
}

const CODE_PREFIX = "NORI-MP1.";
const MAX_SIGNAL_BYTES = 256 * 1024;
const MAX_ENCODED_SIGNAL_LENGTH = Math.ceil(MAX_SIGNAL_BYTES * 4 / 3) + 1024;

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000)
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string): Uint8Array {
  const padded = text.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((text.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream, maxBytes = Infinity): Promise<Uint8Array> {
  const output = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  const reader = output.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maxBytes) {
        await reader.cancel();
        throw new Error("code is too large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const result = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.byteLength; }
  return result;
}

/**
 * Copy/paste signaling codes. SDP is compressed when the browser can, so the
 * code stays short enough for chat apps; `z`/`j` marks the encoding.
 */
export async function encodeSignal(value: unknown): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(value));
  if (typeof CompressionStream === "function") {
    try { return `${CODE_PREFIX}z${toBase64Url(await pipe(json, new CompressionStream("deflate-raw")))}`; }
    catch { /* Fall back to plain JSON below. */ }
  }
  return `${CODE_PREFIX}j${toBase64Url(json)}`;
}

export async function decodeSignal<T>(code: string): Promise<T> {
  const text = code.trim().replace(/\s+/g, "");
  if (!text.startsWith(CODE_PREFIX)) throw new Error("not a Nori multiplayer code");
  const body = text.slice(CODE_PREFIX.length);
  if (body.length - 1 > MAX_ENCODED_SIGNAL_LENGTH) throw new Error("code is too large");
  const bytes = fromBase64Url(body.slice(1));
  let json: Uint8Array;
  if (body[0] === "z") {
    if (typeof DecompressionStream !== "function") throw new Error("this browser cannot read compressed codes");
    json = await pipe(bytes, new DecompressionStream("deflate-raw"), MAX_SIGNAL_BYTES);
  } else if (body[0] === "j") json = bytes;
  else throw new Error("unknown code encoding");
  if (json.length > MAX_SIGNAL_BYTES) throw new Error("code is too large");
  return JSON.parse(new TextDecoder().decode(json)) as T;
}

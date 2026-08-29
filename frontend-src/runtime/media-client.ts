import { issueArcadeTicket } from "./http";
import { ARCADE_MEDIA_PATH, ARCADE_SUBPROTOCOL } from "./protocol";

export type MediaFrameListener = (frame: ArrayBuffer) => void;

function websocketUrl(path: string): string {
  const url = new URL(path, window.location.href);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.toString();
}

export class ArcadeMediaClient {
  private socket: WebSocket | null = null;
  private readonly listeners = new Set<MediaFrameListener>();

  onFrame(listener: MediaFrameListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async connect(grant: string): Promise<void> {
    this.close();
    const { ticket } = await issueArcadeTicket();
    const socket = new WebSocket(websocketUrl(ARCADE_MEDIA_PATH), [ARCADE_SUBPROTOCOL, `ticket.${ticket}`]);
    socket.binaryType = "arraybuffer";
    this.socket = socket;
    await new Promise<void>((resolve, reject) => {
      socket.addEventListener("open", () => {
        socket.send(JSON.stringify({ type: "open_media", grant }));
        resolve();
      }, { once: true });
      socket.addEventListener("error", () => reject(new Error("Arcade media socket failed to open")), { once: true });
    });
    socket.addEventListener("message", (event) => {
      if (event.data instanceof ArrayBuffer) for (const listener of this.listeners) listener(event.data);
    });
  }

  close(): void {
    this.socket?.close(1000, "client_close");
    this.socket = null;
  }
}

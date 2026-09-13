import { issueArcadeTicket } from "./http";
import { ARCADE_MEDIA_PATH, ARCADE_SUBPROTOCOL } from "./protocol";

export type MediaFrameListener = (frame: ArrayBuffer) => void;
export type MediaState = "idle" | "connecting" | "open" | "closed";

export class ArcadeMediaClient {
  private socket: WebSocket | null = null;
  private epoch = 0;
  private cancelOpening: (() => void) | null = null;
  private state: MediaState = "idle";
  private readonly listeners = new Set<MediaFrameListener>();
  private readonly stateListeners = new Set<(state: MediaState) => void>();
  get connectionState() {
    return this.state;
  }
  onFrame(listener: MediaFrameListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  onState(listener: (state: MediaState) => void): () => void {
    this.stateListeners.add(listener);
    listener(this.state);
    return () => {
      this.stateListeners.delete(listener);
    };
  }
  private publish(state: MediaState) {
    this.state = state;
    this.stateListeners.forEach((listener) => listener(state));
  }

  async connect(grant: string): Promise<void> {
    this.close();
    const epoch = this.epoch;
    this.publish("connecting");
    try {
      const { ticket } = await issueArcadeTicket();
      if (epoch !== this.epoch) return;
      const url = new URL(ARCADE_MEDIA_PATH, window.location.href);
      url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
      const socket = new WebSocket(url, [
        ARCADE_SUBPROTOCOL,
        `ticket.${ticket}`,
      ]);
      socket.binaryType = "arraybuffer";
      this.socket = socket;
      await new Promise<void>((resolve, reject) => {
        let settled = false;
        const settle = (error?: Error) => {
          if (settled) return;
          settled = true;
          clearTimeout(timeout);
          this.cancelOpening = null;
          if (error) reject(error);
          else resolve();
        };
        const timeout = setTimeout(() => {
          settle(new Error("Media connection timed out"));
          socket.close();
        }, 15000);
        this.cancelOpening = () => settle();
        // Install before open: an immediate server frame must not be dropped.
        socket.addEventListener("message", (event) => {
          if (epoch !== this.epoch) return;
          if (event.data instanceof ArrayBuffer)
            this.listeners.forEach((listener) => listener(event.data));
        });
        socket.addEventListener(
          "open",
          () => {
            if (epoch !== this.epoch) {
              socket.close();
              settle();
              return;
            }
            socket.send(JSON.stringify({ type: "open_media", grant }));
            this.publish("open");
            settle();
          },
          { once: true },
        );
        socket.addEventListener("error", () => {
          settle(new Error("Media connection failed"));
          socket.close();
        });
        socket.addEventListener("close", () => {
          settle(new Error("Media connection closed before opening"));
          if (epoch === this.epoch) {
            this.socket = null;
            this.publish("closed");
          }
        });
      });
    } catch (error) {
      if (epoch === this.epoch) {
        this.socket?.close();
        this.socket = null;
        this.publish("closed");
        throw error;
      }
    }
  }
  close(): void {
    this.epoch++;
    this.cancelOpening?.();
    this.cancelOpening = null;
    this.socket?.close(1000, "client_close");
    this.socket = null;
    this.publish("closed");
  }
}

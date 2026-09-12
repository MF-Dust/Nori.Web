import type { ChatLine } from "./chat-runtime";

export const CONVERSATION_BUBBLE_LIFETIME_MS = 30_000;
export interface ConversationBubble extends ChatLine {
  id: string;
  receivedAt: number;
}

/** Shipped Lye/i2e: mount history stays silent; local receipt time owns expiry. */
export class ConversationTimeline {
  private epoch: number | null = null;
  private received = new Map<string, number | null>();
  private lines: ConversationBubble[] = [];

  update(epoch: number, lines: readonly ChatLine[], now: number) {
    const changed = epoch !== this.epoch;
    if (changed) this.received.clear();
    this.epoch = epoch;
    const present = new Set<string>();
    this.lines = [];
    for (const line of lines) {
      if (line.isSpeech === false) continue;
      const id =
        line.blockId == null
          ? line.messageId
          : `${line.messageId}:${line.blockId}`;
      present.add(id);
      if (!this.received.has(id)) this.received.set(id, changed ? null : now);
      const receivedAt = this.received.get(id);
      if (receivedAt != null) this.lines.push({ ...line, id, receivedAt });
    }
    for (const id of this.received.keys())
      if (!present.has(id)) this.received.delete(id);
    return this.visible(now);
  }

  visible(now: number): ConversationBubble[] {
    return this.lines
      .filter(
        (line) => line.receivedAt >= now - CONVERSATION_BUBBLE_LIFETIME_MS,
      )
      .slice(-3);
  }
}

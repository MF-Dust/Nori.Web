import {
  compareSignalMessages,
  type SignalConversation,
  type SignalMessage,
  type SignalThread,
} from "./messenger";
import { parseSignalTimestamp } from "./signal-story-clock";

export interface MessageKeyGesture {
  key: string;
  shiftKey?: boolean;
  keyCode?: number;
  nativeEvent?: { isComposing?: boolean };
}

/** Browsers expose active IME composition through either flag or the legacy 229 key code. */
export function isMessageCompositionActive(
  event: MessageKeyGesture,
  compositionRef = false,
): boolean {
  return (
    compositionRef ||
    event.nativeEvent?.isComposing === true ||
    event.keyCode === 229
  );
}

export function shouldSubmitMessageKey(
  event: MessageKeyGesture,
  compositionRef = false,
  multiline = false,
): boolean {
  return (
    event.key === "Enter" &&
    !(multiline && event.shiftKey) &&
    !isMessageCompositionActive(event, compositionRef)
  );
}

export function isConversationNearBottom(
  metrics: Pick<HTMLElement, "scrollHeight" | "scrollTop" | "clientHeight">,
  threshold = 48,
): boolean {
  return (
    metrics.scrollHeight - metrics.scrollTop - metrics.clientHeight <= threshold
  );
}

/** Clear only the draft that actually completed; text entered during the request survives. */
export function draftAfterSuccessfulSend(
  current: string,
  sent: string,
): string {
  return current.trim() === sent ? "" : current;
}


function signalTimestampMs(value: string | undefined): number {
  if (!value) return 0;
  const parsed = parseSignalTimestamp(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function messageAtOrAfter(message: SignalMessage, floor: string | undefined): boolean {
  return floor === undefined || signalTimestampMs(message.timestamp) >= signalTimestampMs(floor);
}

export interface SignalThreadReadState {
  read: boolean;
  unreadCount: number;
  pendingReadFacts: string[];
}

/** Exact shipped thread-level unread/reread semantics recovered from NormalApp. */
export function signalThreadReadState(
  thread: SignalThread,
  messages: readonly SignalMessage[],
  localReadFacts: ReadonlySet<string>,
  hasFact?: (factId: string) => boolean,
): SignalThreadReadState {
  if (!thread.readFact)
    return { read: true, unreadCount: 0, pendingReadFacts: [] };

  const isRead = (factId: string) =>
    localReadFacts.has(factId) || hasFact?.(factId) === true;
  const incoming = messages.filter((message) => !message.self);
  const unreadEligibleCount = incoming.filter((message) =>
    messageAtOrAfter(message, thread.unreadFrom),
  ).length;
  const initialUnread = !isRead(thread.readFact);
  const reread = thread.reread;
  const rereadUnread =
    reread !== undefined &&
    hasFact?.(reread.when) === true &&
    !isRead(reread.readFact);
  const pendingReadFacts = [
    ...(initialUnread ? [thread.readFact] : []),
    ...(rereadUnread && reread ? [reread.readFact] : []),
  ];
  const rereadEligibleCount = reread
    ? incoming.filter((message) =>
        messageAtOrAfter(message, reread.unreadFrom),
      ).length
    : 0;

  return {
    read: pendingReadFacts.length === 0,
    unreadCount: initialUnread
      ? unreadEligibleCount
      : rereadUnread
        ? rereadEligibleCount
        : 0,
    pendingReadFacts,
  };
}

/** Shipped thread list is ordered by each conversation's newest message. */
export function compareSignalConversationRecency(
  left: SignalConversation,
  right: SignalConversation,
): number {
  const leftLast = left.messages.at(-1);
  const rightLast = right.messages.at(-1);
  if (leftLast && rightLast) return compareSignalMessages(rightLast, leftLast);
  return (leftLast ? 0 : 1) - (rightLast ? 0 : 1);
}


/** Shipped CHe/EHe total used by the Signal Dock badge. */
export function signalConversationUnreadCount(
  conversations: readonly SignalConversation[],
  hasFact?: (factId: string) => boolean,
  localReadFacts: ReadonlySet<string> = new Set<string>(),
): number {
  return conversations.reduce(
    (total, conversation) =>
      total +
      signalThreadReadState(
        conversation.thread,
        conversation.messages,
        localReadFacts,
        hasFact,
      ).unreadCount,
    0,
  );
}


export interface SignalLocalReadFactsStore {
  snapshot(): ReadonlySet<string>;
  mark(factIds: readonly string[]): void;
  clear(): void;
  subscribe(listener: () => void): () => void;
}

/** Source equivalent of shipped _He.localReadByFactId / markReadLocal. */
export function createSignalLocalReadFactsStore(
  initial: Iterable<string> = [],
): SignalLocalReadFactsStore {
  let facts: ReadonlySet<string> = new Set(initial);
  const listeners = new Set<() => void>();
  const publish = () => {
    for (const listener of listeners) listener();
  };
  return {
    snapshot: () => facts,
    mark(factIds) {
      const next = new Set(facts);
      let changed = false;
      for (const factId of factIds) {
        if (!factId || next.has(factId)) continue;
        next.add(factId);
        changed = true;
      }
      if (!changed) return;
      facts = next;
      publish();
    },
    clear() {
      if (facts.size === 0) return;
      facts = new Set();
      publish();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

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

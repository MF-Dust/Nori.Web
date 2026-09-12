import type {
  ChatCardColor,
  ChatMessageContent,
  ChatPanelMessage,
  ChatTextWithBadgeContent,
} from "../components/chat-panel";

export type CodenamesClueCount = number | "infinity";

export type CodenamesChatPayload =
  | { type: "clue"; word: string; count: CodenamesClueCount }
  | { type: "guess"; word: string; result: ChatCardColor }
  | { type: "turnEnded"; reason: "bystander" | "all_found" | "voluntary" | string }
  | { type: "assassinHit" }
  | { type: "system"; text: string; tone?: "info" | "success" | "warning" | "danger" | string }
  | { type: "suddenDeath" };

export interface CodenamesRawChatMessage {
  id: string;
  sender: string;
  message: CodenamesChatPayload | null | undefined;
}

export type CodenamesTranslate = (
  key: string,
  values?: Readonly<Record<string, string | number>>,
) => string;

function guessContent(
  word: string,
  result: ChatCardColor,
  translate: CodenamesTranslate,
): ChatTextWithBadgeContent {
  return {
    type: "textWithBadge",
    text: translate("codenames.messages.tapped"),
    badge: {
      type: "wordBadge",
      word,
      cardColor: result,
    },
  };
}

/**
 * Source-owned equivalent of the shipped GameScreen Codenames chat formatter.
 *
 * Keep translation keys and the clue/turn-ending normalization aligned with
 * `GameScreen-*`; ChatPanel owns the visual word-badge presentation.
 */
export function formatCodenamesChatMessage(
  message: CodenamesChatPayload | null | undefined,
  translate: CodenamesTranslate,
): ChatMessageContent {
  if (!message || typeof message !== "object" || !("type" in message)) {
    return translate("codenames.messages.invalidMessage");
  }

  switch (message.type) {
    case "clue": {
      const clueCount = message.count === "infinity" ? "∞" : String(message.count);
      return translate("codenames.messages.gaveClue", {
        word: message.word.toUpperCase(),
        clueCount,
      });
    }
    case "guess":
      return guessContent(message.word, message.result, translate);
    case "turnEnded":
      switch (message.reason) {
        case "bystander":
          return translate("codenames.messages.hitBystanderTurnEnded");
        case "all_found":
          return translate("codenames.messages.foundAllTurnEnded");
        case "voluntary":
          return translate("codenames.messages.endedGuessing");
        default:
          return message.reason;
      }
    case "assassinHit":
      return translate("codenames.messages.hitAssassin");
    case "system":
      return message.text;
    case "suddenDeath":
      return translate("codenames.messages.suddenDeath");
  }
}

/** Mirrors the shipped GameScreen filtering and tone normalization before ChatPanel. */
export function recoverCodenamesChatMessages(
  messages: readonly CodenamesRawChatMessage[],
  translate: CodenamesTranslate,
): ChatPanelMessage[] {
  return messages
    .filter((item) => item && typeof item === "object" && item.message != null)
    .map((item) => ({
      id: item.id,
      sender: item.sender,
      content: formatCodenamesChatMessage(item.message, translate),
      tone:
        item.message?.type === "system" && item.message.tone !== "info"
          ? item.message.tone
          : undefined,
    }));
}

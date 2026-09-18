import React from "react";
import { createRoot } from "react-dom/client";
import { MessengerScreen } from "../frontend-src/screens/messenger-shipped-surfaces";
import { ConversationPanel } from "../frontend-src/components/conversation-panel";
import type { SignalConversation } from "../frontend-src/apps/messenger";
import type { NoriFrontendRuntime } from "../frontend-src/runtime/frontend-runtime";
import type { ChatSnapshot } from "../frontend-src/apps/chat-runtime";
import "../frontend-src/styles/app.css";

const threadMessages = Array.from({ length: 32 }, (_, index) => ({
  threadId: "service",
  messageId: `history-${index}`,
  sender: index % 2 ? "我" : "Fixture Service",
  kind: "text",
  body: `History message ${index}`,
  timestamp: `2026-08-18T10:${String(index).padStart(2, "0")}:00Z`,
  self: index % 2 === 1,
  raw: {},
}));
let conversations: SignalConversation[] = [
  {
    thread: {
      threadId: "service",
      title: "Fixture Service",
      participants: ["Fixture Service", "我"],
      service: true,
      raw: {},
    },
    messages: [
      ...threadMessages,
      {
        threadId: "service",
        messageId: "photo-good",
        sender: "Fixture Service",
        kind: "image",
        body: "",
        timestamp: "2026-08-18T11:00:00Z",
        self: false,
        assetPath: "/messenger-good.png",
        alt: "Fixture photo",
        dimensions: { width: 40, height: 30 },
        raw: {},
      },
      {
        threadId: "service",
        messageId: "photo-broken",
        sender: "Fixture Service",
        kind: "image",
        body: "",
        timestamp: "2026-08-18T11:01:00Z",
        self: false,
        assetPath: "/messenger-missing.png",
        alt: "Broken fixture photo",
        raw: {},
      },
      {
        threadId: "service",
        messageId: "file-failed",
        sender: "Fixture Service",
        kind: "file",
        body: "",
        timestamp: "2026-08-18T11:02:00Z",
        self: false,
        fileName: "retry.dat",
        sizeBytes: 2048,
        downloadFact: "download.fail",
        raw: {},
      },
    ],
  },
  {
    thread: {
      threadId: "quiet",
      title: "Quiet Thread",
      participants: ["Quiet", "我"],
      service: false,
      raw: {},
    },
    messages: [
      {
        threadId: "quiet",
        messageId: "quiet-1",
        sender: "Quiet",
        kind: "text",
        body: "Searchable final body",
        timestamp: "2026-08-17T09:00:00Z",
        readFact: "quiet.unread",
        self: false,
        raw: {},
      },
    ],
  },
];

const messengerListeners = new Set<() => void>();
const facts = new Set<string>();
const serviceSends: string[] = [];
const downloads: string[] = [];
const messengerRuntime = {
  model: {
    async conversations() {
      return conversations;
    },
    async markThreadRead() {},
    async emitDownloadFact(factId: string) {
      downloads.push(factId);
      if (factId === "download.fail")
        throw new Error("fixture download failed");
      facts.add(factId);
      messengerListeners.forEach((listener) => listener());
    },
  },
  subscribe(listener: () => void) {
    messengerListeners.add(listener);
    return () => messengerListeners.delete(listener);
  },
  hasFact: (factId: string) => facts.has(factId),
  serviceConversation: {
    isInteractive: (thread: { threadId: string }) =>
      thread.threadId === "service",
    isTyping: () => false,
    async send(_thread: unknown, body: string) {
      serviceSends.push(body);
      await new Promise((resolve) => setTimeout(resolve, 80));
      if (body === "fail") throw new Error("fixture send failed");
    },
  },
};

let chat: ChatSnapshot = {
  presentationEpoch: 1,
  lines: [],
  connected: true,
  phase: "idle",
  mode: "text",
  pending: false,
  error: null,
};
const chatListeners = new Set<() => void>();
const floatingSends: string[] = [];
const sceneSnapshot = {
  active: false,
  chatMode: "normal" as const,
  noriTexture: "default" as const,
};
const floatingFrontend = {
  conversation: {
    snapshot: () => chat,
    subscribe(listener: () => void) {
      chatListeners.add(listener);
      return () => chatListeners.delete(listener);
    },
    async send(body: string) {
      floatingSends.push(body);
      await new Promise((resolve) => setTimeout(resolve, 80));
      return body !== "fail";
    },
  },
  scene: {
    snapshot: () => sceneSnapshot,
    subscribe: () => () => {},
  },
  audio: { playCue() {} },
} as unknown as NoriFrontendRuntime;

declare global {
  interface Window {
    messengerProbe: {
      serviceSends: string[];
      downloads: string[];
      floatingSends: string[];
      appendMessage(): void;
      showFloatingLines(): void;
    };
  }
}

window.messengerProbe = {
  serviceSends,
  downloads,
  floatingSends,
  appendMessage() {
    conversations = conversations.map((conversation) =>
      conversation.thread.threadId === "service"
        ? {
            ...conversation,
            messages: [
              ...conversation.messages,
              {
                ...threadMessages[0],
                messageId: `new-${conversation.messages.length}`,
                body: "Newest fixture message",
                timestamp: "2026-08-18T12:00:00Z",
              },
            ],
          }
        : conversation,
    );
    messengerListeners.forEach((listener) => listener());
  },
  showFloatingLines() {
    chat = {
      ...chat,
      lines: [0, 1, 2].map((index) => ({
        messageId: `floating-${index}`,
        blockId: 0,
        sender: index === 1 ? "player" : "agent",
        content: `Long floating message ${index} ${"wrapped content ".repeat(20)}`,
        isSpeech: true,
      })),
    };
    chatListeners.forEach((listener) => listener());
  },
};

const mode = new URLSearchParams(location.search).get("mode") ?? "messenger";
createRoot(document.getElementById("root")!).render(
  mode === "floating" ? (
    <ConversationPanel frontend={floatingFrontend} locale="en" />
  ) : (
    <MessengerScreen runtime={messengerRuntime as never} />
  ),
);

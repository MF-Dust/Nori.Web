import React from "react";
import { createRoot } from "react-dom/client";
import { MessengerScreen } from "../../../frontend-src/screens/messenger-shipped-surfaces";
import { ConversationPanel } from "../../../frontend-src/components/conversation-panel";
import { NotificationLayer } from "../../../frontend-src/components/notification-layer";
import { createNotificationStore } from "../../../frontend-src/state/notification-store";
import type { SignalConversation } from "../../../frontend-src/apps/messenger";
import {
  SignalDanielConversationRuntime,
  SIGNAL_DANIEL_DEADMAN_FACT,
} from "../../../frontend-src/apps/signal-daniel";
import type { NoriFrontendRuntime } from "../../../frontend-src/runtime/frontend-runtime";
import type { ChatSnapshot } from "../../../frontend-src/apps/chat-runtime";
import "../../../frontend-src/styles/app.css";
import "../../../frontend-src/styles/desktop-shell.css";

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
      avatarPath: "/messenger-good.png",
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
      readFact: "quiet.unread",
      unreadFrom: "2026-08-17T00:00:00",
      reread: {
        when: "quiet.reread.when",
        readFact: "quiet.reread",
        unreadFrom: "2026-08-17T08:30:00",
      },
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
        self: false,
        raw: {},
      },
    ],
  },
  {
    thread: {
      threadId: "zero-count",
      title: "Zero Count Thread",
      participants: ["Zero", "我"],
      service: false,
      readFact: "zero.read",
      unreadFrom: "2026-09-01T00:00:00",
      raw: {},
    },
    messages: [
      {
        threadId: "zero-count",
        messageId: "zero-old",
        sender: "Zero",
        kind: "text",
        body: "Old message outside unread window",
        timestamp: "2026-08-16T09:00:00Z",
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
const readThreads: string[] = [];
const messengerRuntime = {
  model: {
    async conversations() {
      return conversations;
    },
    async markThreadRead(threadId: string) {
      readThreads.push(threadId);
    },
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

const pendingCues: string[] = [];
let pendingFocusThreadId: string | null = "quiet";
let pendingFocusConsumed = false;
const pendingMessengerRuntime = {
  ...messengerRuntime,
  playCue(cue: string) {
    pendingCues.push(cue);
  },
  getPendingFocusThreadId() {
    return pendingFocusThreadId;
  },
  consumePendingFocusThreadId() {
    pendingFocusThreadId = null;
    pendingFocusConsumed = true;
  },
};


const danielFacts = new Set<string>([SIGNAL_DANIEL_DEADMAN_FACT]);
const danielCues: string[] = [];
const danielCommands: Array<{ command: string; answer?: string }> = [];
const danielConversation: SignalConversation = {
  thread: {
    threadId: "daniel",
    title: "Daniel Fixture",
    participants: ["Daniel Fixture", "我"],
    service: true,
    raw: {},
  },
  messages: [
    {
      threadId: "daniel",
      messageId: "daniel-history",
      sender: "Daniel Fixture",
      kind: "text",
      body: "Archived fixture message",
      timestamp: "2026-08-18T11:50:00Z",
      self: false,
      raw: {},
    },
    {
      threadId: "daniel",
      messageId: "daniel-evidence-file",
      sender: "OpenFlaw 助理",
      kind: "file",
      body: "",
      timestamp: "2026-08-18T12:00:00Z",
      sortMs: 1,
      self: false,
      fileName: "handoff.pdf",
      sizeBytes: 4096,
      downloadFact: "daniel.fixture.downloaded",
      raw: {},
    },
  ],
};

const danielRuntime = new SignalDanielConversationRuntime({
  manifold: {
    async command(command: string, payload?: Record<string, unknown>) {
      const answer = typeof payload?.answer === "string" ? payload.answer : undefined;
      danielCommands.push({ command, ...(answer === undefined ? {} : { answer }) });
      if (answer === undefined) {
        return { ok: true, result: { reply: ["Resume fixture"] } } as never;
      }
      if (answer === "interrupt") {
        return { ok: true, result: { reply: ["Obsolete delayed reply"] } } as never;
      }
      return {
        ok: true,
        result: { reply: ["First verified reply", "Second verified reply"] },
      } as never;
    },
  } as never,
  hasFact: (factId) => danielFacts.has(factId),
  playCue: (cue) => danielCues.push(cue),
  initialJumpEpoch: "world-a",
});

const danielMessengerRuntime = {
  model: {
    async conversations() {
      return [danielConversation];
    },
    async markThreadRead() {},
    async emitDownloadFact(factId: string) {
      danielFacts.add(factId);
    },
  },
  hasFact: (factId: string) => danielFacts.has(factId),
  playCue: (cue: string) => danielCues.push(cue),
  serviceConversation: danielRuntime,
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
const notificationStore = createNotificationStore();
const notificationOpened: string[] = [];
const notificationTranslate = (key: string, values?: Record<string, string | number>) => {
  const labels: Record<string, string> = {
    "os.notifications.clear": "Clear",
    "os.notifications.clearAll": "Clear All",
    "os.notifications.more": `+${values?.count ?? 0} more`,
  };
  return labels[key] ?? key;
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
      danielCues: string[];
      danielCommands: Array<{ command: string; answer?: string }>;
      jumpDanielWorld(): void;
      readThreads: string[];
      triggerQuietReread(): void;
      pendingCues: string[];
      pendingFocusConsumed(): boolean;
      pushNotification(title?: string): void;
      notificationOpened: string[];
    };
  }
}

window.messengerProbe = {
  serviceSends,
  downloads,
  floatingSends,
  danielCues,
  danielCommands,
  readThreads,
  pendingCues,
  notificationOpened,
  pushNotification(title = "Fixture notification") {
    notificationStore.push({
      appId: "mail",
      title,
      subtitle: "Fixture subtitle",
      body: "Fixture body",
      action: { type: "open-app", appId: "mail" },
    });
  },
  pendingFocusConsumed() {
    return pendingFocusConsumed;
  },
  triggerQuietReread() {
    facts.add("quiet.reread.when");
    conversations = [...conversations];
    messengerListeners.forEach((listener) => listener());
  },
  jumpDanielWorld() {
    danielRuntime.syncJumpEpoch("world-b");
  },
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
  ) : mode === "notifications" ? (
    <NotificationLayer
      store={notificationStore}
      translate={notificationTranslate}
      onOpenApp={(appId) => notificationOpened.push(appId)}
    />
  ) : mode === "daniel" ? (
    <MessengerScreen runtime={danielMessengerRuntime as never} />
  ) : mode === "pending" ? (
    <MessengerScreen runtime={pendingMessengerRuntime as never} />
  ) : (
    <MessengerScreen runtime={messengerRuntime as never} />
  ),
);

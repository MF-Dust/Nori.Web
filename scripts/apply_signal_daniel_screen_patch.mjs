import fs from "node:fs";

const path = "frontend-src/screens/messenger-screen.tsx";
let source = fs.readFileSync(path, "utf8");

function replaceExact(label, before, after) {
  const count = source.split(before).length - 1;
  if (count !== 1) {
    throw new Error(`${label}: expected exactly one match, found ${count}`);
  }
  source = source.replace(before, after);
}

replaceExact(
  "service runtime interface",
`export interface SignalServiceConversationRuntime {
  isInteractive?: (thread: SignalThread) => boolean;
  isTyping?: (thread: SignalThread) => boolean;
  send?: (thread: SignalThread, body: string) => void | Promise<void>;
}`,
`export interface SignalServiceConversationRuntime {
  isInteractive?: (thread: SignalThread) => boolean;
  isTyping?: (thread: SignalThread) => boolean;
  send?: (thread: SignalThread, body: string) => void | Promise<void>;
  subscribe?: (listener: () => void) => () => void;
  resolveMessages?: (
    thread: SignalThread,
    staticMessages: readonly SignalMessage[],
  ) => SignalMessage[];
  onOpen?: (thread: SignalThread) => void;
  getComposerPlaceholder?: (thread: SignalThread) => string | undefined;
  /** null hides the badge, undefined falls back to the generic service badge. */
  getServiceBadge?: (thread: SignalThread) => string | null | undefined;
}`,
);

replaceExact(
  "service send preserves shipped body",
`  const send = async () => {
    const trimmed = body.trim();
    if (!trimmed || sending || !runtime.serviceConversation?.send) return;
    runtime.playCue?.("comms-signal-verify-send");
    setSending(true);
    try {
      await runtime.serviceConversation.send(thread, trimmed);
      setBody("");
    } finally {
      setSending(false);
    }
  };`,
`  const send = async () => {
    if (!body.trim() || sending || !runtime.serviceConversation?.send) return;
    runtime.playCue?.("comms-signal-verify-send");
    setSending(true);
    try {
      await runtime.serviceConversation.send(thread, body);
      setBody("");
    } finally {
      setSending(false);
    }
  };`,
);

replaceExact(
  "Daniel composer placeholder",
`            placeholder={t("signal.composer.servicePlaceholder")}
            aria-label={t("signal.composer.servicePlaceholder")}`,
`            placeholder={runtime.serviceConversation?.getComposerPlaceholder?.(thread) ?? t("signal.composer.servicePlaceholder")}
            aria-label={runtime.serviceConversation?.getComposerPlaceholder?.(thread) ?? t("signal.composer.servicePlaceholder")}`,
);

replaceExact(
  "conversation runtime state",
`  const { thread, messages } = conversation;
  const grouped = useMemo(() => groupMessages(messages), [messages]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const interactive = runtime.serviceConversation?.isInteractive?.(thread) === true;
  const typing = runtime.serviceConversation?.isTyping?.(thread) === true;

  useEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [messages, typing]);`,
`  const { thread, messages } = conversation;
  const [, setServiceRevision] = useState(0);
  const serviceConversation = runtime.serviceConversation;

  useEffect(() => serviceConversation?.subscribe?.(() => {
    setServiceRevision((revision) => revision + 1);
  }), [serviceConversation]);

  useEffect(() => {
    serviceConversation?.onOpen?.(thread);
  }, [serviceConversation, thread]);

  const interactive = serviceConversation?.isInteractive?.(thread) === true;
  const typing = serviceConversation?.isTyping?.(thread) === true;
  const resolvedMessages = serviceConversation?.resolveMessages?.(thread, messages) ?? messages;
  const grouped = useMemo(() => groupMessages(resolvedMessages), [resolvedMessages]);
  const serviceBadge = serviceConversation?.getServiceBadge?.(thread);
  const showServiceBadge = serviceBadge === undefined ? thread.service : serviceBadge !== null;
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [resolvedMessages, typing]);`,
);

replaceExact(
  "service badge",
`            {thread.service ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                <Bot className="size-2.5" />{t("signal.conversation.serviceBadge")}
              </span>
            ) : null}`,
`            {showServiceBadge ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                <Bot className="size-2.5" />{serviceBadge ?? t("signal.conversation.serviceBadge")}
              </span>
            ) : null}`,
);

fs.writeFileSync(path, source);
console.log(`Patched ${path}`);

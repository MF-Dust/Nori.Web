import fs from "node:fs";

const screenPath = "frontend-src/screens/messenger-screen.tsx";
let screen = fs.readFileSync(screenPath, "utf8");

screen = screen.replace("  LoaderCircle,\n", "");

if (!screen.includes("SIGNAL_DANIEL_EVIDENCE_FACT")) {
  const importNeedle = `} from "../apps/messenger";\n`;
  if (!screen.includes(importNeedle)) throw new Error("Messenger import anchor not found");
  screen = screen.replace(
    importNeedle,
    `${importNeedle}import { SIGNAL_DANIEL_EVIDENCE_FACT } from "../apps/signal-daniel";\n`,
  );
}

screen = screen.replace(
  `  getComposerPlaceholder?: (thread: SignalThread) => string | undefined;\n`,
  "",
);

const composerStart = screen.indexOf("function ServiceComposer({");
const composerEnd = screen.indexOf("function TypingBubble", composerStart);
if (composerStart < 0 || composerEnd < 0) throw new Error("ServiceComposer boundary not found");
const composer = `function ServiceComposer({
  thread,
  runtime,
  t,
}: {
  thread: SignalThread;
  runtime: MessengerScreenRuntime;
  t: MessengerTranslate;
}) {
  const [body, setBody] = useState("");
  const typing = runtime.serviceConversation?.isTyping?.(thread) === true;
  const send = () => {
    const trimmed = body.trim();
    if (!trimmed || typing || !runtime.serviceConversation?.send) return;
    runtime.playCue?.("comms-signal-verify-send");
    void runtime.serviceConversation.send(thread, trimmed);
    setBody("");
  };

  return (
    <div className="relative shrink-0 border-t border-border/50">
      <div className="flex items-end gap-2 px-3 py-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border px-3 py-2 focus-within:ring-1 focus-within:ring-ring/40">
          <input
            type="text"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                event.preventDefault();
                send();
              }
            }}
            autoComplete="off"
            placeholder={t("signal.composer.servicePlaceholder")}
            aria-label={t("signal.composer.servicePlaceholder")}
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        <button type="button" onClick={send} disabled={!body.trim() || typing} aria-label={t("signal.composer.send")} className="mb-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40">
          <SendHorizontal className="size-[18px]" />
        </button>
      </div>
    </div>
  );
}

`;
screen = screen.slice(0, composerStart) + composer + screen.slice(composerEnd);

const typingAnchor = `  const interactive = serviceConversation?.isInteractive?.(thread) === true;\n  const typing = serviceConversation?.isTyping?.(thread) === true;\n`;
if (!screen.includes("comms-signal-evidence-unlock")) {
  if (!screen.includes(typingAnchor)) throw new Error("Conversation typing anchor not found");
  screen = screen.replace(
    typingAnchor,
    `${typingAnchor}  const typingWasActive = useRef(typing);\n  const evidenceUnlocked = runtime.hasFact?.(SIGNAL_DANIEL_EVIDENCE_FACT) === true;\n  const evidenceWasUnlocked = useRef(evidenceUnlocked);\n\n  useEffect(() => {\n    if (typing && !typingWasActive.current) runtime.playCue?.("comms-signal-typing");\n    typingWasActive.current = typing;\n  }, [runtime, typing]);\n\n  useEffect(() => {\n    if (evidenceUnlocked && !evidenceWasUnlocked.current) {\n      runtime.playCue?.("comms-signal-evidence-unlock");\n    }\n    evidenceWasUnlocked.current = evidenceUnlocked;\n  }, [evidenceUnlocked, runtime]);\n`,
  );
}

fs.writeFileSync(screenPath, screen);

for (const path of [
  "scripts/inspect_signal_messenger_runtime.mjs",
  "scripts/apply_signal_daniel_screen_patch.mjs",
]) {
  if (fs.existsSync(path)) fs.unlinkSync(path);
}

console.log("Signal Messenger fidelity patch applied; temporary non-workflow tooling removed.");

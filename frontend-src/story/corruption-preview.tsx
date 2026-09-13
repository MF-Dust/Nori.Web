import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { NoriFrontendRuntime } from "../runtime/frontend-runtime";
import { NORI_SHELL_LAYERS } from "../state/window-layout-runtime";
import { StoryClock, type StoryClockState } from "./story-clock";
import { StoryAudio } from "./story-audio";
import {
  CORRUPTION_AUDIO,
  CORRUPTION_MARKERS,
  CORRUPTION_PHASES,
  corruptionScene,
} from "./corruption-timeline";
import { AntivirusGames } from "./antivirus-games";

function Preview({
  frontend,
  close,
}: {
  frontend: NoriFrontendRuntime;
  close(): void;
}) {
  const [state, setState] = useState<StoryClockState>(() =>
    new StoryClock(CORRUPTION_PHASES).snapshot(),
  );
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const clockRef = useRef<StoryClock | null>(null);
  const audioRef = useRef<StoryAudio | null>(null);
  const closeRef = useRef(close);
  const dialog = useRef<HTMLDivElement>(null);
  closeRef.current = close;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
      }
      if (event.key !== "Tab") return;
      const items = [
        ...(dialog.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),input:not(:disabled),[tabindex="0"]',
        ) ?? []),
      ].filter((item) => item.getClientRects().length);
      const first = items[0],
        last = items.at(-1);
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          !dialog.current?.contains(document.activeElement))
      ) {
        event.preventDefault();
        last?.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          !dialog.current?.contains(document.activeElement))
      ) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", keyboard);
    return () => {
      document.removeEventListener("keydown", keyboard);
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  useEffect(() => {
    const clock = new StoryClock(CORRUPTION_PHASES),
      audio = new StoryAudio(frontend.audio, CORRUPTION_AUDIO);
    clockRef.current = clock;
    audioRef.current = audio;
    const lease = frontend.scene.acquire();
    const world = frontend.world.snapshot().worldId;
    let frame = 0,
      previous = performance.now(),
      voiceWait = 0;
    const visibility = () => {
      previous = performance.now();
      if (document.hidden || pausedRef.current || !document.hasFocus())
        clock.suspend(previous);
      else clock.resume(previous);
      audio.sync(clock.snapshot());
    };
    const unsubscribeWorld = frontend.world.subscribe((next) => {
      if (next.worldId !== world) closeRef.current();
    });
    const unsubscribeStory = frontend.story.subscribe(() => {
      if (frontend.story.snapshot()) closeRef.current();
    });
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("blur", visibility);
    window.addEventListener("focus", visibility);
    visibility();
    const render = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - previous) / 1000));
      previous = now;
      let next = clock.advance(now);
      if (
        next.parkedAt === "awaitVoice" &&
        !document.hidden &&
        document.hasFocus() &&
        !pausedRef.current
      ) {
        voiceWait += dt;
        if (voiceWait >= 12) {
          clock.wake("awaitVoice", now);
          next = clock.snapshot();
        }
      }
      lease.set(corruptionScene(next));
      audio.sync(next);
      setState(next);
      if (next.complete) closeRef.current();
      else frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frame);
      unsubscribeWorld();
      unsubscribeStory();
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("blur", visibility);
      window.removeEventListener("focus", visibility);
      audio.dispose();
      clock.dispose();
      lease.release();
      clockRef.current = null;
      audioRef.current = null;
    };
  }, [frontend]);
  const wake = (phase: string) => {
    if (!pausedRef.current && !document.hidden)
      clockRef.current?.wake(phase, performance.now());
  };
  return createPortal(
    <div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-label="Corruption interaction preview"
      className="corruption-preview-overlay"
      data-corruption-phase={state.phase}
      data-corruption-time={state.time}
      style={{ zIndex: NORI_SHELL_LAYERS.CUTSCENE }}
    >
      <div className="corruption-preview-toolbar">
        <span>
          Corruption preview · {state.phase} · {state.time.toFixed(2)} s
        </span>
        <button
          type="button"
          onClick={() => {
            const next = !pausedRef.current;
            pausedRef.current = next;
            setPaused(next);
            if (next) clockRef.current?.suspend(performance.now());
            else if (!document.hidden && document.hasFocus())
              clockRef.current?.resume(performance.now());
            if (clockRef.current)
              audioRef.current?.sync(clockRef.current.snapshot());
          }}
        >
          {paused ? "Resume study" : "Pause study"}
        </button>
        <button type="button" onClick={close}>
          Close study
        </button>
      </div>
      {state.parkedAt === "qte" ? (
        <AntivirusGames
          audio={frontend.audio}
          paused={paused}
          onComplete={() => wake("qte")}
        />
      ) : (
        <div className="corruption-preview-phase">
          <strong>
            {state.phase === "entry"
              ? "RECOVERY CONSOLE / INITIALIZING"
              : state.phase === "heal"
                ? "INTEGRITY RESTORATION"
                : state.parkedAt === "wake"
                  ? "恢复完成，等待唤醒"
                  : state.parkedAt === "awaitVoice"
                    ? "语音等待点"
                    : state.phase}
          </strong>
          {state.parkedAt === "awaitVoice" && (
            <>
              <p>预览可确认继续；等待满 12 秒后继续。</p>
              <button
                type="button"
                disabled={paused}
                onClick={() => wake("awaitVoice")}
              >
                Continue voice gate
              </button>
            </>
          )}
          {state.phase === "heal" && (
            <progress
              aria-label="恢复阶段进度"
              max="17"
              value={state.time - CORRUPTION_MARKERS.heal}
            />
          )}
          {state.parkedAt === "wake" && (
            <button
              type="button"
              disabled={paused}
              onClick={() => wake("wake")}
            >
              Wake model
            </button>
          )}
        </div>
      )}
    </div>,
    document.body,
  );
}
export function CorruptionPreview({
  frontend,
}: {
  frontend: NoriFrontendRuntime;
}) {
  const [active, setActive] = useState(false),
    [error, setError] = useState("");
  return (
    <div>
      <h2>Corruption interaction study</h2>
      <p>
        Inspect the eleven-phase timeline and six antivirus microgames. This
        preview does not complete the production story or submit facts.
      </p>
      <button
        type="button"
        disabled={active}
        onClick={() => {
          if (frontend.story.snapshot()) {
            setError("A production story is active");
            return;
          }
          setError("");
          setActive(true);
          void frontend.audio
            .unlock()
            .catch((reason) => setError(String(reason)));
        }}
      >
        Open corruption study
      </button>
      {error && <p role="alert">{error}</p>}
      {active && <Preview frontend={frontend} close={() => setActive(false)} />}
    </div>
  );
}

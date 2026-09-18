import { HeadPatAudio } from "./head-pat-audio";
import type { Live2DModel } from "./engine.js";
import type { NoriFrontendRuntime } from "../runtime/frontend-runtime";
import type { WindowRect } from "../state/window-types";

export function bindHeadPatInput(
  host: HTMLElement,
  model: Live2DModel,
  frontend: NoriFrontendRuntime,
) {
  const surface = document.createElement("button");
  surface.type = "button";
  surface.className = "nori-head-pat";
  surface.dataset.noriPatSurface = "";
  surface.setAttribute("aria-label", "Pat Nori's head");
  surface.title = "Drag across the head, or hold Space";
  host.append(surface);
  const gesture = frontend.headPat;
  const rubbing = new HeadPatAudio(
    () => frontend.audio.sfxRoute(),
    () => frontend.headPat.tuning(),
  );
  const particles = new Map<HTMLElement, Animation>();
  const clearParticles = () => {
    particles.forEach((animation, element) => {
      animation.cancel();
      element.remove();
    });
    particles.clear();
  };
  const burst = () => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    clearParticles();
    const bounds = surface.getBoundingClientRect(),
      root = host.getBoundingClientRect();
    for (let i = 0; i < 10; i++) {
      const point = document.createElement("span");
      point.className = "nori-pat-spark";
      point.setAttribute("aria-hidden", "true");
      point.textContent = i % 3 ? "✦" : "·";
      point.style.left = `${bounds.left - root.left + bounds.width / 2}px`;
      point.style.top = `${bounds.top - root.top + bounds.height / 3}px`;
      host.append(point);
      const angle = -Math.PI + Math.PI * (i / 9),
        distance = 32 + (i % 4) * 11;
      const animation = point.animate(
        [
          { opacity: 0, transform: "translate(-50%, -50%) scale(.2)" },
          { opacity: 1, offset: 0.15 },
          {
            opacity: 0,
            transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance - 15}px) scale(.7)`,
          },
        ],
        { duration: 750 + (i % 3) * 100, easing: "ease-out" },
      );
      particles.set(point, animation);
      animation.onfinish = () => {
        particles.delete(point);
        point.remove();
      };
    }
  };
  let pointer: number | null = null,
    keyboard = false,
    keyTime = 0;
  let epoch = frontend.conversation.snapshot().presentationEpoch;
  let previous = performance.now(),
    idleAt = previous;
  const stop = () => {
    if (pointer !== null && surface.hasPointerCapture(pointer))
      surface.releasePointerCapture(pointer);
    pointer = null;
    keyboard = false;
    gesture.end();
    rubbing.stop();
    surface.dataset.patting = "false";
  };
  const complete = () => {
    burst();
    frontend.requestPatReaction();
    surface.dataset.completions = String(
      Number(surface.dataset.completions ?? 0) + 1,
    );
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches)
      surface.animate(
        [
          { boxShadow: "0 0 0 0 #a9efd077" },
          { boxShadow: "0 0 0 20px #a9efd000" },
        ],
        { duration: 600 },
      );
  };
  const sample = (event: PointerEvent) => {
    const bounds = surface.getBoundingClientRect();
    return {
      x: (event.clientX - bounds.left) / Math.max(1, bounds.width),
      y: (event.clientY - bounds.top) / Math.max(1, bounds.width),
    };
  };
  surface.onpointerdown = (event) => {
    if (event.button !== 0 || pointer !== null || surface.disabled) return;
    const point = sample(event);
    pointer = event.pointerId;
    keyboard = false;
    void frontend.audio.unlock().catch(() => {});
    gesture.start(performance.now(), point.x, point.y);
    idleAt = performance.now();
    surface.setPointerCapture(event.pointerId);
    event.preventDefault();
  };
  surface.onpointermove = (event) => {
    if (pointer !== event.pointerId) return;
    if (!event.buttons) {
      stop();
      return;
    }
    const point = sample(event);
    const tuning = gesture.tuning();
    if (
      point.x < -tuning.leashHeadWidths ||
      point.x > 1 + tuning.leashHeadWidths ||
      point.y < -tuning.leashHeadWidths ||
      point.y > 1 + tuning.leashHeadWidths
    ) {
      stop();
      return;
    }
    idleAt = performance.now();
    if (gesture.move(idleAt, point.x, point.y)) complete();
    surface.dataset.patting = String(gesture.pressing);
  };
  surface.onpointerup =
    surface.onpointercancel =
    surface.onlostpointercapture =
      stop;
  surface.onkeydown = (event) => {
    if (event.code !== "Space" || event.repeat || surface.disabled) return;
    event.preventDefault();
    stop();
    keyboard = true;
    keyTime = performance.now();
    void frontend.audio.unlock().catch(() => {});
    gesture.start(keyTime, 0.5, 0.2);
  };
  surface.onkeyup = (event) => {
    if (event.code === "Space") {
      event.preventDefault();
      stop();
    }
  };
  surface.onblur = stop;
  window.addEventListener("blur", stop);
  const visibility = () => {
    if (document.hidden) stop();
  };
  document.addEventListener("visibilitychange", visibility);
  const reset = () => {
    stop();
    clearParticles();
  };
  const offScene = frontend.scene.subscribe(() => {
    const state = frontend.scene.snapshot();
    if (state.active || state.chatMode !== "normal" || state.noriSleep) reset();
  });
  const offWorld = frontend.world.subscribe((_state, event) => {
    if (["world_joined", "world_created", "world_left"].includes(event.type))
      reset();
  });
  return {
    update(rect: WindowRect) {
      const now = performance.now(),
        scene = frontend.scene.snapshot(),
        chat = frontend.conversation.snapshot();
      const blocked =
        scene.active ||
        scene.chatMode !== "normal" ||
        scene.noriSleep ||
        !chat.connected ||
        document.hidden ||
        host.dataset.noriIdle !== "idle";
      gesture.enabled = !blocked;
      if (blocked || epoch !== chat.presentationEpoch) stop();
      epoch = chat.presentationEpoch;
      surface.disabled = blocked;
      surface.hidden = blocked;
      if (keyboard) {
        if (gesture.move(now, 0.5 + Math.sin((now - keyTime) / 100) * 0.3, 0.2))
          complete();
      } else if (now - idleAt > 140) gesture.pressing = false;
      gesture.velocity *= Math.exp(
        -Math.min(0.05, (now - previous) / 1000) /
          gesture.tuning().strokeReleaseTau,
      );
      previous = now;
      try {
        rubbing.update(gesture.velocity, gesture.pressing && !blocked);
      } catch {
        rubbing.dispose();
      }
      const bounds = model.getPartsBounds(["Part9"]);
      const first = bounds && model.modelToCanvasUV(bounds.left, bounds.top);
      const last =
        bounds &&
        model.modelToCanvasUV(
          bounds.right,
          bounds.top -
            (bounds.top - bounds.bottom) * gesture.tuning().skullTopBand,
        );
      if (!first || !last) {
        surface.hidden = true;
        stop();
        return;
      }
      const x = rect.x + Math.min(first.u, last.u) * rect.width;
      const y = rect.y + Math.min(first.v, last.v) * rect.height;
      Object.assign(surface.style, {
        left: `${x}px`,
        top: `${y}px`,
        width: `${Math.abs(first.u - last.u) * rect.width}px`,
        height: `${Math.abs(first.v - last.v) * rect.height}px`,
      });
      surface.dataset.progress = String(gesture.progress);
    },
    dispose() {
      reset();
      offScene();
      offWorld();
      rubbing.dispose();
      window.removeEventListener("blur", stop);
      document.removeEventListener("visibilitychange", visibility);
      surface.remove();
    },
  };
}

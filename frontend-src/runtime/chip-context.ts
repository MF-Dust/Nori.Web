import type { ChipTarget } from "./chip-controller";

/** Capture only rendered window text, not hidden story resources or input values. */
export async function collectChipContent(target: ChipTarget): Promise<string> {
  if (target.appId === "nori") {
    return document.querySelector<HTMLElement>(".conversation-lines")?.innerText.slice(-12000) ?? "Nori, the companion currently visible on the desktop. No further visible information is available.";
  }
  const host = document.querySelector<HTMLElement>(`[data-window-host="${CSS.escape(target.instanceId)}"]`);
  if (!host) return "";
  const frames = [...host.querySelectorAll("iframe")].filter(frame => frame.getClientRects().length && getComputedStyle(frame).visibility !== "hidden");
  const texts = await Promise.all(frames.map(frame => new Promise<string>(resolve => {
    const requestId = crypto.randomUUID();
    const done = (text: string) => { clearTimeout(timer); window.removeEventListener("message", receive); resolve(text); };
    const receive = (event: MessageEvent) => {
      if (event.source === frame.contentWindow && event.data?.__arcade === true && event.data.type === "analysis-content" && event.data.requestId === requestId)
        done(typeof event.data.text === "string" ? event.data.text.slice(0, 12000) : "");
    };
    const timer = setTimeout(() => done(""), 1000);
    window.addEventListener("message", receive);
    frame.contentWindow?.postMessage({ __arcade: true, type: "analysis-request", requestId }, "*");
  })));
  return [host.innerText, ...texts].join("\n").trim().slice(0, 12000);
}

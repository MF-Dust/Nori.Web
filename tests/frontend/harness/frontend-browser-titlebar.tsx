import { useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserScreen } from "../../../frontend-src/screens/browser-screen";
import {
  ManagedWindowRuntimeProvider,
  WindowAppRuntimeProvider,
  WindowPresentationRuntimeProvider,
  type WindowTitleBarContentValue,
} from "../../../frontend-src/components/window-runtime-context";

const metrics = { publishes: 0, clears: 0, focuses: 0, titlebarMouseDowns: 0, titlebarDoubleClicks: 0 };
const app = { createWindow() {} } as never;
const managedWindow = { focus() { metrics.focuses++; } } as never;
const runtime = { model: {} as never };
const setTitle = () => {};

function TestWindow() {
  const [content, setContent] = useState<WindowTitleBarContentValue | null>(null);
  const [mounted, setMounted] = useState(true);
  const [maximized, setMaximized] = useState(false);
  const [presentation, setPresentation] = useState(true);
  const [title, setTitleText] = useState("Browser");
  const [, rerender] = useState(0);
  const publish = useCallback((value: WindowTitleBarContentValue | null) => {
    metrics.publishes++;
    if (!value) metrics.clears++;
    if (metrics.publishes > 20) throw new Error("Titlebar publication is looping");
    setContent(value);
  }, []);
  useEffect(() => {
    Object.assign(window, { fixture: {
      metrics,
      maximize: setMaximized,
      mounted: setMounted,
      presentation: setPresentation,
      title: setTitleText,
      rerender: () => rerender(value => value + 1),
    } });
  }, []);
  const screen = mounted && <BrowserScreen runtime={runtime} isMaximized={maximized}
    setTitle={setTitle} translate={key => key === "browser.title" ? title : key} />;
  return <WindowAppRuntimeProvider value={app}>
    <ManagedWindowRuntimeProvider value={managedWindow}>
      <div id="titlebar" onMouseDown={() => metrics.titlebarMouseDowns++}
        onDoubleClick={() => metrics.titlebarDoubleClicks++}>{content?.left}</div>
      <div id="content">{presentation
        // Intentionally recreate the context wrapper on every host render.
        ? <WindowPresentationRuntimeProvider value={{ setTitleBarContent: publish }}>{screen}</WindowPresentationRuntimeProvider>
        : screen}</div>
    </ManagedWindowRuntimeProvider>
  </WindowAppRuntimeProvider>;
}

createRoot(document.getElementById("root")!).render(<TestWindow />);

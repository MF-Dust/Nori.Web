import type { ComponentType } from "react";
import type { ProductionWindowBinding } from "../state/production-window-apps";
import type { WindowComponentProps } from "../state/window-types";
import {
  BROWSER_HOME_URL,
  BrowserPodcastRuntime,
} from "./browser-page-runtime";
import {
  BrowserScreen,
  type BrowserScreenProps,
} from "../screens/browser-screen";
import {
  BrowserPageView,
  type BrowserPageHostRuntime,
} from "../screens/browser-page-view";
import {
  BrowserPopupScreen,
  type BrowserPageViewProps as PopupPageViewProps,
} from "../screens/browser-popup-screen";
import type { BrowserIntentStore } from "../intents/browser-intent";

export type BrowserTranslate = (key: string) => string;

export interface BrowserPresentationRuntime {
  page: BrowserPageHostRuntime;
  translate: BrowserTranslate;
  intent?: BrowserIntentStore;
  defaultUrl?: string;
  playCue?: BrowserScreenProps["playCue"];
  onReady?: (instanceId: string) => void;
  setPageContext?: (instanceId: string, context: string | null) => void;
}

/** Backward-compatible popup-only runtime shape retained for callers migrating incrementally. */
export interface BrowserPopupPresentationRuntime {
  defaultUrl: string;
  translate: BrowserTranslate;
  PageView: ComponentType<PopupPageViewProps>;
  onReady?: (instanceId: string) => void;
  setPageContext?: (instanceId: string, context: string | null) => void;
}

export function createBrowserProductionWindowBindings(
  runtime: BrowserPresentationRuntime,
): { main: ProductionWindowBinding; popup: ProductionWindowBinding } {
  const podcast = runtime.page.podcast ?? new BrowserPodcastRuntime();
  const pageRuntime: BrowserPageHostRuntime = { ...runtime.page, podcast };

  function MainWindow(props: WindowComponentProps) {
    return (
      <BrowserScreen
        runtime={pageRuntime}
        initialUrl={typeof props.url === "string" ? props.url : undefined}
        intent={runtime.intent}
        isMaximized={props.snap === "maximized"}
        setTitle={props.setTitle}
        translate={runtime.translate}
        playCue={runtime.playCue}
        onReady={() => runtime.onReady?.(props.instanceId)}
        setPageContext={(context) => runtime.setPageContext?.(props.instanceId, context)}
      />
    );
  }

  const PopupPageView: ComponentType<PopupPageViewProps> = (props) => (
    <BrowserPageView
      runtime={pageRuntime}
      url={props.url}
      reloadNonce={props.reloadNonce}
      isMaximized={props.isMaximized}
      onTitleChange={props.onTitleChange}
      onEnvelopeChange={props.onEnvelopeChange}
      onActivate={props.onActivate}
      onReady={props.onReady}
    />
  );

  function PopupWindow(props: WindowComponentProps) {
    return (
      <BrowserPopupScreen
        instanceId={props.instanceId}
        url={typeof props.url === "string" ? props.url : undefined}
        defaultUrl={runtime.defaultUrl ?? BROWSER_HOME_URL}
        isMaximized={props.snap === "maximized"}
        setTitle={props.setTitle}
        translate={runtime.translate}
        activateWindow={() => props.focus()}
        onReady={() => runtime.onReady?.(props.instanceId)}
        setPageContext={(context) => runtime.setPageContext?.(props.instanceId, context)}
        PageView={PopupPageView}
      />
    );
  }

  return {
    main: { component: MainWindow },
    popup: { component: PopupWindow },
  };
}

export function createBrowserPopupProductionWindowBinding(
  runtime: BrowserPopupPresentationRuntime,
): ProductionWindowBinding {
  function BoundBrowserPopup(props: WindowComponentProps) {
    const url = typeof props.url === "string" ? props.url : undefined;
    return (
      <BrowserPopupScreen
        instanceId={props.instanceId}
        url={url}
        defaultUrl={runtime.defaultUrl}
        isMaximized={props.snap === "maximized"}
        setTitle={props.setTitle}
        translate={runtime.translate}
        activateWindow={() => props.focus()}
        onReady={() => runtime.onReady?.(props.instanceId)}
        setPageContext={(context) => runtime.setPageContext?.(props.instanceId, context)}
        PageView={runtime.PageView}
      />
    );
  }

  return { component: BoundBrowserPopup };
}

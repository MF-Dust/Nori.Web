import type { ComponentType } from "react";
import {
  BrowserPopupScreen,
  type BrowserPageViewProps,
} from "../screens/browser-popup-screen";
import type { ProductionWindowBinding } from "../state/production-window-apps";
import type { WindowComponentProps } from "../state/window-types";

export interface BrowserPopupPresentationRuntime {
  defaultUrl: string;
  translate: (key: string) => string;
  PageView: ComponentType<BrowserPageViewProps>;
  onReady?: (instanceId: string) => void;
  setPageContext?: (instanceId: string, context: string | null) => void;
}

/**
 * Binds the recovered Browser popup shell while keeping BrowserPageView as an
 * explicit injected migration boundary. The large renderer/sandbox chunk can
 * therefore be replaced independently without changing desktop integration.
 */
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
        setPageContext={(context) =>
          runtime.setPageContext?.(props.instanceId, context)
        }
        PageView={runtime.PageView}
      />
    );
  }

  return { component: BoundBrowserPopup };
}

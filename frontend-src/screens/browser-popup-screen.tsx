import { useCallback, useEffect, useState, type ComponentType } from "react";
import { Lock } from "lucide-react";

export interface BrowserPageViewProps {
  url: string;
  reloadNonce: number;
  isMaximized: boolean;
  onTitleChange: (title: string) => void;
  onEnvelopeChange: (envelopeId: string | null) => void;
  onActivate: () => void;
  onReady: () => void;
}

export interface BrowserPopupScreenProps {
  instanceId: string;
  url?: string;
  defaultUrl: string;
  isMaximized: boolean;
  setTitle: (title: string) => void;
  translate: (key: string) => string;
  activateWindow: (instanceId: string) => void;
  onReady: () => void;
  setPageContext?: (context: string | null) => void;
  PageView: ComponentType<BrowserPageViewProps>;
}

/**
 * Recovered shell around the shipped BrowserPageView. The large page renderer
 * remains a separate migration boundary so its DOM/sandbox behavior can be
 * verified independently before replacement.
 */
export function BrowserPopupScreen({
  instanceId,
  url,
  defaultUrl,
  isMaximized,
  setTitle,
  translate,
  activateWindow,
  onReady,
  setPageContext,
  PageView,
}: BrowserPopupScreenProps) {
  const activeUrl = url ?? defaultUrl;
  const [pageTitle, setPageTitle] = useState("");
  const [envelopeId, setEnvelopeId] = useState<string | null>(null);

  useEffect(() => {
    setPageContext?.(envelopeId ? `page:${envelopeId}` : null);
    return () => setPageContext?.(null);
  }, [envelopeId, setPageContext]);

  useEffect(() => {
    setTitle(pageTitle || translate("browser.title"));
  }, [pageTitle, setTitle, translate]);

  const activate = useCallback(() => {
    activateWindow(instanceId);
  }, [activateWindow, instanceId]);

  return (
    <div className="flex h-full flex-col bg-white text-zinc-950">
      <div className="flex items-center gap-2 border-b border-zinc-200 bg-zinc-50 px-3 py-2">
        <Lock className="size-3.5 shrink-0 text-zinc-400" />
        <div className="min-w-0 flex-1 truncate rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-500">
          {activeUrl}
        </div>
      </div>
      <div className="relative min-h-0 flex-1 bg-white">
        <PageView
          url={activeUrl}
          reloadNonce={0}
          isMaximized={isMaximized}
          onTitleChange={setPageTitle}
          onEnvelopeChange={setEnvelopeId}
          onActivate={activate}
          onReady={onReady}
        />
      </div>
    </div>
  );
}

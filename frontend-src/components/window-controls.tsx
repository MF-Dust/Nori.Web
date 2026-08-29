import { memo, type MouseEvent } from "react";

export type WindowControlKind = "close" | "minimize" | "maximize";

const CONTROL_STYLE = {
  close: {
    background: "rgba(255, 95, 87, 0.85)",
    glow: "rgba(255, 95, 87, 0.5)",
  },
  minimize: {
    background: "rgba(255, 189, 46, 0.85)",
    glow: "rgba(255, 189, 46, 0.5)",
  },
  maximize: {
    background: "rgba(40, 200, 64, 0.85)",
    glow: "rgba(40, 200, 64, 0.5)",
  },
} as const;

export interface WindowControlButtonProps {
  kind: WindowControlKind;
  label: string;
  disabled?: boolean;
  onClick?: () => void;
}

export const WindowControlButton = memo(function WindowControlButton({
  kind,
  label,
  disabled = false,
  onClick,
}: WindowControlButtonProps) {
  const palette = CONTROL_STYLE[kind];
  const stopTitlebarDrag = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
  };

  return (
    <button
      type="button"
      className="relative flex size-3 items-center justify-center rounded-full transition-transform active:scale-[0.85] disabled:opacity-50"
      style={{
        backgroundColor: disabled ? "rgba(128, 128, 128, 0.3)" : palette.background,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
      }}
      disabled={disabled}
      aria-label={label}
      onMouseDown={stopTitlebarDrag}
      onDoubleClick={stopTitlebarDrag}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.();
      }}
      onMouseEnter={(event) => {
        if (!disabled) event.currentTarget.style.boxShadow = `0 0 8px ${palette.glow}`;
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.25)";
      }}
    />
  );
});

export interface WindowControlsProps {
  instanceId: string;
  closable: boolean;
  minimizable: boolean;
  maximizable: boolean;
  maximized: boolean;
  exclusive?: boolean;
  onClose?: (instanceId: string) => void;
  onMinimize?: (instanceId: string) => void;
  onMaximize?: (instanceId: string) => void;
}

export const WindowControls = memo(function WindowControls({
  instanceId,
  closable,
  minimizable,
  maximizable,
  maximized,
  exclusive = false,
  onClose,
  onMinimize,
  onMaximize,
}: WindowControlsProps) {
  return (
    <div className="flex flex-shrink-0 items-center gap-2">
      {closable && (
        <WindowControlButton
          kind="close"
          label={exclusive ? "Exit" : "Close"}
          onClick={() => onClose?.(instanceId)}
        />
      )}
      {minimizable && (
        <WindowControlButton
          kind="minimize"
          label="Minimize"
          onClick={() => onMinimize?.(instanceId)}
        />
      )}
      {maximizable && (
        <WindowControlButton
          kind="maximize"
          label={maximized ? "Restore" : "Maximize"}
          onClick={() => onMaximize?.(instanceId)}
        />
      )}
    </div>
  );
});

import { Cpu, Volume1, Volume2, VolumeX, type LucideIcon } from "lucide-react";
import type { DesktopRuntime } from "../state/desktop-runtime";
import {
  formatDesktopCompute,
  getEffectiveDesktopCompute,
  type DesktopComputeState,
} from "../state/compute-runtime";
import { useAudioSettings } from "../state/audio-store";
import type { TopBarTranslate } from "./desktop-topbar";

export function getVolumeIcon(volume: number, muted: boolean): LucideIcon {
  return muted || volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;
}

export function DesktopComputeIndicator({ state }: { state: DesktopComputeState }) {
  const effective = getEffectiveDesktopCompute(state);
  return (
    <span
      className={`flex items-center gap-1.5 ${effective.draining ? "animate-pulse text-red-400" : ""}`.trim()}
    >
      <Cpu className="size-4" />
      <span className="text-xs font-medium tabular-nums">
        {formatDesktopCompute(effective.compute)} / {formatDesktopCompute(effective.cap)}
      </span>
    </span>
  );
}

export function DesktopComputeSummary({ state }: { state: DesktopComputeState }) {
  const effective = getEffectiveDesktopCompute(state);
  return (
    <span className="text-xs tabular-nums text-muted-foreground">
      {formatDesktopCompute(effective.compute)} / {formatDesktopCompute(effective.cap)}
    </span>
  );
}

export interface DesktopSoundIndicatorProps {
  runtime: DesktopRuntime;
  translate: TopBarTranslate;
  expanded: boolean;
  onToggle(): void;
  closeMenu(): void;
}

/** Maintainable reconstruction of NormalApp's `$Ge` sound menu. */
export function DesktopSoundIndicator({
  runtime,
  translate,
  expanded,
  onToggle,
  closeMenu,
}: DesktopSoundIndicatorProps) {
  const masterVolume = useAudioSettings((state) => state.masterVolume);
  const isMuted = useAudioSettings((state) => state.isMuted);
  const setMasterVolume = useAudioSettings((state) => state.setMasterVolume);
  const toggleMute = useAudioSettings((state) => state.toggleMute);
  const TriggerIcon = getVolumeIcon(masterVolume, isMuted);
  const SliderIcon = getVolumeIcon(isMuted ? 0 : masterVolume, false);

  const openSettings = () => {
    const state = runtime.store.getState();
    if (!state.processes.settings) {
      void state.launchApp({ appId: "settings", mode: "activate" });
    }
    closeMenu();
  };

  return (
    <div className="relative" data-nori-sound-indicator="true">
      <button
        type="button"
        className="topbar-indicator-trigger"
        aria-haspopup="menu"
        aria-expanded={expanded}
        onClick={onToggle}
      >
        <TriggerIcon className="size-4" />
      </button>
      {expanded && (
        <div
          className="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg"
          role="menu"
        >
          <div
            className="flex items-center gap-2 px-2 py-1.5"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={translate("topbar.sound.mute")}
              onClick={(event) => {
                event.stopPropagation();
                toggleMute();
              }}
            >
              <SliderIcon className="size-4" />
            </button>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={isMuted ? 0 : masterVolume}
              className="min-w-0 flex-1"
              aria-label={translate("topbar.sound.volume")}
              onChange={(event) => {
                const value = Number(event.currentTarget.value);
                if (isMuted && value > 0) toggleMute();
                setMasterVolume(value);
              }}
            />
          </div>
          <div className="my-1 h-px bg-border" role="separator" />
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center rounded-sm px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground"
            onClick={openSettings}
          >
            {translate("topbar.sound.settings")}
          </button>
        </div>
      )}
    </div>
  );
}

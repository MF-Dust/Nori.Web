import { memo } from "react";
import type { CakeDuelTranslate } from "./cakeduel-hud";

export type CakeDuelBannerMessage =
  | { type: "claim"; actualCards: readonly string[]; claim: string; isPlayer: boolean }
  | { type: "accepted" }
  | { type: "challenge" }
  | { type: "bout_start"; boutNumber: number }
  | { type: "bout_end"; victory: boolean; reason: string };

export interface CakeDuelBannerProps {
  message: CakeDuelBannerMessage | null;
  translate: CakeDuelTranslate;
  resolveClaimColor?: (claim: string) => string;
  resolveCardImage?: (name: string) => string;
}

function rgba(hex: string, alpha: number): string {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return hex;
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);
  return `rgba(${red},${green},${blue},${alpha})`;
}

function hasLightForeground(hex: string): boolean {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return false;
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);
  return red * 0.299 + green * 0.587 + blue * 0.114 > 150;
}

function ClaimCards({
  message,
  resolveCardImage,
}: {
  message: Extract<CakeDuelBannerMessage, { type: "claim" }>;
  resolveCardImage?: (name: string) => string;
}) {
  if (!resolveCardImage || message.actualCards.length === 0) return null;
  return (
    <div className="flex items-center h-full" style={{ paddingLeft: 16 }}>
      {message.actualCards.map((actual, index) => (
        <img
          key={`${actual}:${index}`}
          src={resolveCardImage(message.isPlayer ? actual : message.claim)}
          alt=""
          draggable={false}
          className="h-full w-auto object-contain"
          style={{
            marginLeft: index === 0 ? 0 : -16,
            zIndex: index + 1,
            position: "relative",
            filter: message.isPlayer ? "none" : "grayscale(1)",
          }}
        />
      ))}
    </div>
  );
}

/** Source-owned shipped Cake Duel full-width claim/challenge/bout banner. */
export const CakeDuelBanner = memo(function CakeDuelBanner({
  message,
  translate,
  resolveClaimColor = () => "#FECE08",
  resolveCardImage,
}: CakeDuelBannerProps) {
  if (!message) return null;

  const claimColor = message.type === "claim" ? resolveClaimColor(message.claim) : null;
  const background = claimColor
    ? `linear-gradient(to right, ${rgba(claimColor, 0.15)}, ${rgba(claimColor, 0.85)}, ${rgba(
        claimColor,
        0.85,
      )}, ${rgba(claimColor, 0.15)})`
    : message.type === "bout_end"
      ? message.victory
        ? "linear-gradient(to right, rgba(6,78,59,0.85), rgba(4,120,87,0.95), rgba(4,120,87,0.95), rgba(6,78,59,0.85))"
        : "linear-gradient(to right, rgba(127,29,29,0.85), rgba(153,27,27,0.95), rgba(153,27,27,0.95), rgba(127,29,29,0.85))"
      : "linear-gradient(to right, rgba(69,26,3,0.9), rgba(120,53,15,0.96), rgba(69,26,3,0.9))";

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
      data-cakeduel-banner={message.type}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div className={`relative w-full flex justify-center ${message.type === "claim" ? "items-end" : "items-center"}`}>
        <div className="absolute inset-0 border-y border-white/10" style={{ background }} />
        <div className="relative py-5">
          {message.type === "claim" ? (
            <div className="flex items-end gap-4 h-28">
              <ClaimCards message={message} resolveCardImage={resolveCardImage} />
              <span
                className="text-xl font-black tracking-wide"
                style={{ color: hasLightForeground(claimColor ?? "#000000") ? "#1a1000" : "#fff" }}
              >
                {message.actualCards.length}× {translate(`cakeduel.cards.${message.claim}`)}
              </span>
            </div>
          ) : null}
          {message.type === "accepted" ? (
            <span className="text-2xl font-black tracking-widest uppercase text-amber-200">
              {translate("cakeduel.banner.accepted")}
            </span>
          ) : null}
          {message.type === "challenge" ? (
            <span className="text-3xl font-black tracking-widest uppercase text-red-400 drop-shadow-[0_0_12px_rgba(248,113,113,0.5)]">
              {translate("cakeduel.banner.challenge")}
            </span>
          ) : null}
          {message.type === "bout_start" ? (
            <span className="text-2xl font-black tracking-widest uppercase text-amber-100">
              {translate("cakeduel.banner.boutStart", { n: message.boutNumber })}
            </span>
          ) : null}
          {message.type === "bout_end" ? (
            <div className="flex flex-col items-center gap-1">
              <span
                className={`text-3xl font-black tracking-widest uppercase ${
                  message.victory
                    ? "text-emerald-200 drop-shadow-[0_0_14px_rgba(110,231,183,0.6)]"
                    : "text-red-300 drop-shadow-[0_0_14px_rgba(252,129,129,0.6)]"
                }`}
              >
                {translate(message.victory ? "cakeduel.banner.victory" : "cakeduel.banner.defeat")}
              </span>
              <span className={`text-sm font-medium ${message.victory ? "text-emerald-300/70" : "text-red-300/60"}`}>
                {message.reason}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
});

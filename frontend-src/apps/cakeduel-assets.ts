import type { CakeDuelPresentationAssets } from "./cakeduel-presentation";

export type CakeDuelAssetLocale = "en" | "zh-CN" | "ja";

const CAKEDUEL_CARD_HEADS: Readonly<Record<string, string>> = {
  soldier: "soldier",
  archer: "archer",
  wizard: "wizard",
  assassin: "assassin",
  defender: "def",
  scientist: "sci",
  wolfy: "wolf",
};

const CAKEDUEL_CLAIM_COLORS: Readonly<Record<string, string>> = {
  soldier: "#FECE08",
  archer: "#B0D575",
  wizard: "#F49187",
  defender: "#A2BFDC",
  scientist: "#84C1BD",
  wolfy: "#B7C0C3",
};

const CAKEDUEL_DEFAULT_CLAIM_COLOR = "#E6CDE2";

export const CAKEDUEL_BACKGROUND_IMAGE = "/cakeduel/playmat.jpg";
export const CAKEDUEL_CARD_BACK_IMAGE = "/cakeduel/card-back.jpg";
export const CAKEDUEL_CAKE_IMAGE = "/cakeduel/cake.png";
export const CAKEDUEL_TROPHY_IMAGE = "/cakeduel/trophy.png";
export const CAKEDUEL_WOLFY_FRAMES = [
  "/cakeduel/waggle/waggle0.png",
  "/cakeduel/waggle/waggle1.png",
  "/cakeduel/waggle/waggle2.png",
  "/cakeduel/waggle/waggle3.png",
] as const;

/** Shipped i18n normalization used by the localized Cake Duel card assets. */
export function normalizeCakeDuelAssetLocale(locale?: string | null): CakeDuelAssetLocale {
  const normalized = locale?.trim().toLowerCase() ?? "";
  if (normalized === "zh" || normalized === "zh-cn" || normalized === "zh-hans" || normalized.startsWith("zh")) {
    return "zh-CN";
  }
  if (normalized === "ja" || normalized === "ja-jp" || normalized.startsWith("ja")) {
    return "ja";
  }
  return "en";
}

function cardLocalePrefix(locale?: string | null): string {
  const normalized = normalizeCakeDuelAssetLocale(locale);
  return normalized === "en" ? "" : `${normalized}/`;
}

export function resolveCakeDuelCardFront(
  name: string,
  locale?: string | null,
  highResolution = false,
): string {
  const directory = highResolution ? "cards-hd" : "cards";
  return `/cakeduel/${directory}/${cardLocalePrefix(locale)}${name}.jpg`;
}

export function resolveCakeDuelCardIcon(name: string): string {
  return `/cakeduel/heads/${CAKEDUEL_CARD_HEADS[name] ?? "soldier"}.png`;
}

export function resolveCakeDuelClaimColor(claim: string): string {
  return CAKEDUEL_CLAIM_COLORS[claim] ?? CAKEDUEL_DEFAULT_CLAIM_COLOR;
}

/** Production presentation assets recovered from the shipped NormalApp bundle. */
export function createCakeDuelPresentationAssets(
  locale?: string | null,
): CakeDuelPresentationAssets {
  return {
    backgroundImage: CAKEDUEL_BACKGROUND_IMAGE,
    cardBackImage: CAKEDUEL_CARD_BACK_IMAGE,
    cakeImage: CAKEDUEL_CAKE_IMAGE,
    resolveCardFront: (name, highResolution = false) =>
      resolveCakeDuelCardFront(name, locale, highResolution),
    resolveCardIcon: resolveCakeDuelCardIcon,
    resolveClaimColor: resolveCakeDuelClaimColor,
    wolfyFrames: CAKEDUEL_WOLFY_FRAMES,
  };
}

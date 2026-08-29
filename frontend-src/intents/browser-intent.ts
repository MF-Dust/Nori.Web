import type { JsonValue } from "../runtime/protocol";

export const BROWSER_APP_ID = "browser";

export interface AppIntentTarget {
  appId: string;
  args: { [key: string]: JsonValue };
}

export type OpenAppIntent = (target: AppIntentTarget) => void;

/**
 * The shipped browser intent seeds the browser app through its args with
 * `{ url }`. This adapter preserves that observable contract while keeping the
 * still-unrecovered desktop/window manager behind an injected dispatcher.
 */
export class BrowserIntent {
  constructor(private readonly openApp: OpenAppIntent) {}

  open(url: string): void {
    this.openApp({ appId: BROWSER_APP_ID, args: { url } });
  }

  toArgs(url: string): { url: string } {
    return { url };
  }
}

export function openUrlInBrowser(intent: BrowserIntent, url: string): void {
  intent.open(url);
}

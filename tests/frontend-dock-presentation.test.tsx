import assert from "node:assert/strict";
import test from "node:test";
import { Settings as SettingsIcon } from "lucide-react";
import { ProductionDockIcon } from "../frontend-src/apps/production-icons";
import { hasCreditsDockAttention } from "../frontend-src/components/desktop-dock";
import type { DockAppModel } from "../frontend-src/state/dock-runtime";

const iconState = {
  active: false,
  darkened: false,
  installState: "downloaded" as const,
};

function app(id: string): DockAppModel {
  return { id, title: id, app: { id, windows: {} } };
}

test("Credits Dock attention follows farewell shown until Credits is opened", () => {
  assert.equal(hasCreditsDockAttention("credits", new Set()), false);
  assert.equal(
    hasCreditsDockAttention("credits", new Set(["arg.farewell.shown"])),
    true,
  );
  assert.equal(
    hasCreditsDockAttention(
      "credits",
      new Set(["arg.farewell.shown", "credits.opened"]),
    ),
    false,
  );
  assert.equal(
    hasCreditsDockAttention("settings", new Set(["arg.farewell.shown"])),
    false,
  );
});

test("non-image Settings Dock entry renders the shipped gear fallback", () => {
  const outer = ProductionDockIcon({
    app: app("settings"),
    state: iconState,
  }) as any;
  const iconSurface = outer.props.children;
  const glyph = iconSurface.props.children;
  assert.equal(glyph.type, SettingsIcon);
  assert.match(iconSurface.props.className, /dock-ic/);
});

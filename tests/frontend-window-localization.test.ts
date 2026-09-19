import assert from "node:assert/strict";
import test from "node:test";
import { createSourceTranslate } from "../frontend-src/i18n/translate";
import { createDesktopRuntime } from "../frontend-src/state/desktop-runtime";
import { createProductionWindowAppRegistry } from "../frontend-src/state/production-window-apps";

const localizedApps = [
  "credits", "idle", "mail", "files", "browser", "signal", "pictionary",
  "codenames", "chess", "cakeduel", "terminal", "debug", "settings", "preview",
] as const;

test("production app and window fallback titles follow the source locale", () => {
  for (const locale of ["en", "zh-CN"] as const) {
    const t = createSourceTranslate(locale);
    const registry = createProductionWindowAppRegistry({ translate: t });
    for (const appId of localizedApps) {
      const app = registry.lookupApp(appId);
      assert.equal(app?.title, t(`apps.${appId}`), `${locale} ${appId} app title`);
      for (const window of Object.values(app?.windows ?? {})) {
        assert.equal(window.title, t(`apps.${appId}`), `${locale} ${appId} window fallback`);
      }
    }
    assert.equal(registry.lookupApp("system")?.title, "NoriOS");
    assert.equal(registry.lookupWindow("system", "about")?.title, t("windows.aboutNoriOS"));
    assert.equal(registry.lookupWindow("system", "alert")?.title, "NoriOS");
  }
});

test("localized catalog fallbacks do not replace a per-instance custom title", async t => {
  const runtime = createDesktopRuntime({
    translate: createSourceTranslate("zh-CN"),
    enableInstallGuard: false,
  });
  t.after(() => runtime.dispose());
  await runtime.store.getState().launchApp({ appId: "settings", mode: "launch" });
  const instanceId = runtime.store.getState().processes.settings?.windowIds[0];
  assert.ok(instanceId);
  assert.equal(runtime.store.getState().windows[instanceId].title, "设置");
  runtime.store.getState().setWindowTitle(instanceId, "我的设置");
  assert.equal(runtime.store.getState().windows[instanceId].title, "我的设置");
});

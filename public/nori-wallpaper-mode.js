(() => {
  "use strict";

  const WALLPAPER_CLASS = "nori-wallpaper-mode";
  const INTERACTIVE_CLASS = "nori-wallpaper-interactive";
  const HIDDEN_CLASS = "nori-gui-hidden";
  const KEEP_ATTRIBUTE = "data-nori-gui-keep";

  function buildWallpaperUrl(options = {}) {
    const url = new URL(window.location.href);
    url.searchParams.set("wallpaper", "1");
    url.searchParams.delete("mode");
    if (options.interactive === true) url.searchParams.set("interactive", "1");
    else url.searchParams.delete("interactive");
    return url.toString();
  }

  function isWallpaperMode() {
    const params = new URLSearchParams(window.location.search);
    return params.get("wallpaper") === "1" || params.get("mode") === "wallpaper";
  }

  const active = isWallpaperMode();
  const interactive =
    active && new URLSearchParams(window.location.search).get("interactive") === "1";

  window.NoriWallpaperMode = Object.freeze({
    active,
    interactive,
    url: (options) => buildWallpaperUrl(options),
    exit() {
      const url = new URL(window.location.href);
      url.searchParams.delete("wallpaper");
      if (url.searchParams.get("mode") === "wallpaper") url.searchParams.delete("mode");
      url.searchParams.delete("interactive");
      window.location.replace(url.toString());
    },
  });

  if (!active) return;

  const rootElement = document.documentElement;
  rootElement.classList.add(WALLPAPER_CLASS, HIDDEN_CLASS);
  rootElement.classList.toggle(INTERACTIVE_CLASS, interactive);
  rootElement.dataset.noriWallpaper = "1";

  // Wallpaper mode is URL-scoped instead of stored as the ordinary Hide GUI
  // preference. Reassert the presentation class if a settings/storage update
  // tries to restore the normal shell while this dedicated entry is active.
  let enforcing = false;
  function enforceWallpaperMode() {
    if (enforcing) return;
    enforcing = true;
    rootElement.classList.add(WALLPAPER_CLASS, HIDDEN_CLASS);
    rootElement.classList.toggle(INTERACTIVE_CLASS, interactive);
    enforcing = false;
  }

  const classObserver = new MutationObserver(enforceWallpaperMode);
  classObserver.observe(rootElement, { attributes: true, attributeFilter: ["class"] });
  window.addEventListener("nori:ui-settings-changed", enforceWallpaperMode);

  const style = document.createElement("style");
  style.id = "nori-wallpaper-mode-style";
  style.textContent = `
    html.${WALLPAPER_CLASS},
    html.${WALLPAPER_CLASS} body{
      width:100%;height:100%;margin:0;overflow:hidden;background:#000;
      overscroll-behavior:none;
    }
    html.${WALLPAPER_CLASS} body{position:fixed;inset:0}
    html.${WALLPAPER_CLASS} #root{
      width:100vw;height:100vh;overflow:hidden;user-select:none;
    }
    html.${WALLPAPER_CLASS}:not(.${INTERACTIVE_CLASS}) #root [${KEEP_ATTRIBUTE}="1"]{
      pointer-events:none!important;
    }
  `;
  document.head.appendChild(style);

  // A small semantic hook for wallpaper hosts/debugging. The normal Nori.Web
  // entry remains untouched because this event only fires in explicit mode.
  window.dispatchEvent(
    new CustomEvent("nori:wallpaper-mode", {
      detail: { active: true, interactive },
    }),
  );
})();
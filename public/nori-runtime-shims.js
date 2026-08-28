(() => {
  "use strict";

  // The shipped NoriOS bundle reports optional performance vitals to the
  // original os.inori.ai debug endpoint. Privacy/ad-blocking extensions often
  // classify that endpoint as telemetry and block it, which creates noisy
  // ERR_BLOCKED_BY_CLIENT console errors even though the application itself is
  // healthy. Keep that optional diagnostic local instead of touching the
  // network. No application API, Arcade request, or asset request is matched.
  const isPerfVitalsUrl = (value) => {
    try {
      const raw = value instanceof Request ? value.url : String(value || "");
      const url = new URL(raw, window.location.href);
      return url.pathname === "/api/debug/perf-vitals";
    } catch {
      return false;
    }
  };

  const nativeFetch = window.fetch.bind(window);
  window.fetch = function noriFetch(input, init) {
    if (isPerfVitalsUrl(input)) {
      return Promise.resolve(new Response(null, { status: 204 }));
    }
    return nativeFetch(input, init);
  };

  if (typeof navigator.sendBeacon === "function") {
    const nativeSendBeacon = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = function noriSendBeacon(url, data) {
      if (isPerfVitalsUrl(url)) return true;
      return nativeSendBeacon(url, data);
    };
  }
})();

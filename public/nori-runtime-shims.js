(() => {
  "use strict";

  const ACCESS_FLAG = "nori.local.access.v1";

  const pathnameOf = (value) => {
    try {
      const raw = value instanceof Request ? value.url : String(value || "");
      return new URL(raw, window.location.href).pathname;
    } catch {
      return "";
    }
  };

  // The shipped NoriOS bundle reports optional performance vitals to the
  // original os.inori.ai debug endpoint. Privacy/ad-blocking extensions often
  // classify that endpoint as telemetry and block it, which creates noisy
  // ERR_BLOCKED_BY_CLIENT console errors even though the application itself is
  // healthy. Keep that optional diagnostic local instead of touching the
  // network. No application API, Arcade request, or asset request is matched.
  const isPerfVitalsUrl = (value) => pathnameOf(value) === "/api/debug/perf-vitals";
  const isLocalAuthUrl = (value) => {
    try {
      const raw = value instanceof Request ? value.url : String(value || "");
      const url = new URL(raw, window.location.href);
      return url.origin === window.location.origin && url.pathname.startsWith("/api/auth/");
    } catch {
      return false;
    }
  };

  const nativeFetch = window.fetch.bind(window);
  window.fetch = function noriFetch(input, init) {
    if (isPerfVitalsUrl(input)) {
      return Promise.resolve(new Response(null, { status: 204 }));
    }
    // The shipped cross-domain auth plugin uses credentials: "omit". Our
    // same-origin deployment needs real browser cookies for Arcade tickets too.
    // Identity always comes from the server, never a fabricated guest response.
    if (isLocalAuthUrl(input)) {
      return nativeFetch(input, { ...init, credentials: "same-origin" });
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

  // The shipped AlephPro gate uses an email + OTP form. For this local guest
  // deployment the gate is intentionally decorative: any non-empty text should
  // open the server-issued browser guest session. Patch only the first access-gate form;
  // the OTP form has no `input.field`, so it is left alone.
  const patchAccessGate = () => {
    const gate = document.getElementById("access-gate");
    if (!gate) return;

    const input = gate.querySelector("form input.field");
    if (input instanceof HTMLInputElement) {
      if (input.type !== "text") input.type = "text";
      if (input.autocomplete !== "off") input.autocomplete = "off";
      if (input.placeholder !== "输入任意字符即可接入") {
        input.placeholder = "输入任意字符即可接入";
      }
      input.dataset.noriAccessBypass = "1";
    }

    const submit = gate.querySelector('form button[type="submit"].prime');
    if (submit instanceof HTMLButtonElement && !submit.disabled && submit.dataset.noriAccessBusy !== "1") {
      if (submit.textContent !== "直接接入") submit.textContent = "直接接入";
    }
  };

  const startAccessGateObserver = () => {
    patchAccessGate();
    const observer = new MutationObserver(patchAccessGate);
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["type", "placeholder", "disabled"],
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startAccessGateObserver, { once: true });
  } else {
    startAccessGateObserver();
  }

  document.addEventListener(
    "submit",
    (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || !form.closest("#access-gate")) return;

      const input = form.querySelector("input.field");
      if (!(input instanceof HTMLInputElement)) return;
      const value = input.value.trim();
      if (!value) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const submit = form.querySelector('button[type="submit"]');
      if (submit instanceof HTMLButtonElement) {
        submit.dataset.noriAccessBusy = "1";
        submit.disabled = true;
        submit.textContent = "正在接入…";
      }

      sessionStorage.setItem(ACCESS_FLAG, "1");
      window.location.reload();
    },
    true,
  );

  // The historical client cannot send fullUnlock. Mirror the local
  // story/archive choice into a same-origin cookie that the server reads on
  // the arcade handshake. Default to a fresh story; localStorage
  // nori.fullUnlock=1 keeps the finished archive.
  let archive = false;
  try {
    archive = localStorage.getItem("nori.fullUnlock") === "1";
  } catch {
    archive = false;
  }
  document.cookie = "nori_full_unlock=" + (archive ? "1" : "0") + "; path=/; SameSite=Lax";
})();

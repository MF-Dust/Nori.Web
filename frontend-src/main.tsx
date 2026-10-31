import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ViewportGuard } from "./components/viewport-guard";
import { staticAssetOrigin } from "./runtime/static-assets";

if ("serviceWorker" in navigator) {
  void navigator.serviceWorker.register(`/sw.js?staticOrigin=${encodeURIComponent(staticAssetOrigin)}`)
    .catch((error) => console.warn("Asset cache worker unavailable", error));
}

const root = document.getElementById("root");
if (!root) throw new Error("NoriOS source frontend root element is missing");

// Match the shipped entry's case-insensitive, trailing-slash-tolerant route.
// Only import the selected screen: the landing must not initialize the desktop.
const landing = window.location.pathname.replace(/\/+$/, "").toLowerCase() === "/landing";
const App = landing
  ? (await import("./screens/landing-screen")).LandingScreen
  : (await import("./source-app")).SourceApp;

createRoot(root).render(
  <StrictMode>
    <App />
    {!landing && <ViewportGuard />}
  </StrictMode>,
);

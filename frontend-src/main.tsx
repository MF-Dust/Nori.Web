import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SourceApp } from "./source-app";

const root = document.getElementById("root");
if (!root) throw new Error("NoriOS source frontend root element is missing");

createRoot(root).render(
  <StrictMode>
    <SourceApp />
  </StrictMode>,
);

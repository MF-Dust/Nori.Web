(() => {
  "use strict";

  // The historical Settings compatibility panel owns its provider-change
  // listener internally. Keep the two built-in default model names symmetric:
  // switching OpenAI -> Anthropic -> OpenAI must not leave the Anthropic
  // default model selected for an OpenAI-compatible endpoint.
  const OPENAI_DEFAULT_MODEL = "gpt-4o-mini";
  const ANTHROPIC_DEFAULT_MODEL = "claude-3-5-sonnet-20241022";

  document.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement) || target.dataset.field !== "provider") return;
    const panel = target.closest(".nori-ai-settings-panel");
    if (!panel) return;
    const model = panel.querySelector('[data-field="model"]');
    if (!(model instanceof HTMLInputElement)) return;

    const current = model.value.trim();
    if (
      target.value === "openai-compatible" &&
      (!current || current === ANTHROPIC_DEFAULT_MODEL)
    ) {
      model.value = OPENAI_DEFAULT_MODEL;
      return;
    }
    if (
      target.value === "anthropic" &&
      (!current || current === OPENAI_DEFAULT_MODEL)
    ) {
      model.value = ANTHROPIC_DEFAULT_MODEL;
    }
  });
})();

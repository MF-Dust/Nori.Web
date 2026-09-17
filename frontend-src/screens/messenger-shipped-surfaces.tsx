import {
  MessengerScreen as BaseMessengerScreen,
  type MessengerScreenRuntime,
} from "./messenger-screen";

export type { MessengerScreenRuntime };

const SHIPPED_SURFACE_CSS = String.raw`
[data-messenger-shipped-surfaces] .flex.justify-start > .relative.rounded-bl-sm.border {
  background: color-mix(in oklab, var(--secondary-foreground) 10%, var(--secondary));
  border-color: color-mix(in oklab, var(--secondary-foreground) 16%, transparent);
  box-shadow: var(--shadow-sm);
}

[data-messenger-shipped-surfaces] .flex.justify-end > .relative.rounded-br-sm.bg-primary {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.18);
}

[data-messenger-shipped-surfaces] button.cursor-zoom-in:focus-visible,
[data-messenger-shipped-surfaces] button.rounded-full:has(> img.rounded-full):focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in oklab, var(--ring) 60%, transparent);
}
`;

export function MessengerScreen(
  props: Parameters<typeof BaseMessengerScreen>[0],
) {
  return (
    <div className="contents" data-messenger-shipped-surfaces>
      <style>{SHIPPED_SURFACE_CSS}</style>
      <BaseMessengerScreen {...props} />
    </div>
  );
}

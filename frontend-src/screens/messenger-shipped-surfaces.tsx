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

[data-messenger-shipped-surfaces] header + div > div.rounded-md.border {
  background: color-mix(in oklab, var(--background) 60%, transparent);
  border-color: color-mix(in oklab, var(--secondary-foreground) 12%, transparent);
}

[data-messenger-shipped-surfaces]
  div.relative.shrink-0.border-t
  > div.flex.items-end
  > div.min-w-0.flex-1.items-center.rounded-2xl.border {
  background: color-mix(in oklab, var(--background) 60%, transparent);
  border-color: color-mix(in oklab, var(--secondary-foreground) 12%, transparent);
}

[data-messenger-shipped-surfaces] button.cursor-zoom-in:focus-visible,
[data-messenger-shipped-surfaces] button.rounded-full:has(> img.rounded-full):focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in oklab, var(--ring) 60%, transparent);
}

[data-messenger-shipped-surfaces] button.w-full.border-b.border-l-2 {
  border-bottom-color: color-mix(in oklab, var(--border) 50%, transparent);
  border-left-color: transparent;
  transition-duration: 150ms;
  outline: none;
}

[data-messenger-shipped-surfaces] button.w-full.border-b.border-l-2:focus-visible {
  box-shadow: inset 0 0 0 2px color-mix(in oklab, var(--ring) 60%, transparent);
}

[data-messenger-shipped-surfaces] button.w-full.border-b.border-l-2[aria-current="true"] {
  border-left-color: var(--primary);
}

[data-messenger-shipped-surfaces] button.w-full.border-b.border-l-2[aria-current="true"]:hover {
  background: color-mix(in oklab, var(--primary) 18%, transparent);
}

[data-messenger-shipped-surfaces] button.w-full.border-b.border-l-2[aria-current="true"]:active {
  background: color-mix(in oklab, var(--primary) 24%, transparent);
}

[data-messenger-shipped-surfaces] button.w-full.border-b.border-l-2:not([aria-current="true"]):active {
  background: color-mix(in oklab, var(--muted) 60%, transparent);
}

[data-messenger-shipped-surfaces]
  button.w-full.border-b.border-l-2[aria-current="true"]:not(:has(span[aria-label]))
  > div.min-w-0.flex-1
  > div:first-child
  > span:last-child {
  color: color-mix(in oklab, var(--foreground) 70%, transparent);
}

[data-messenger-shipped-surfaces]
  button.w-full.border-b.border-l-2[aria-current="true"]:not(:has(span[aria-label]))
  > div.min-w-0.flex-1
  > div:nth-child(2)
  > span:first-child {
  color: color-mix(in oklab, var(--foreground) 80%, transparent);
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

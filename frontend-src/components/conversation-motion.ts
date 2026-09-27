/** Shipped NormalApp `Uo.stackLift` and the resting bubble-column margin. */
export const CONVERSATION_STACK_LIFT = 94;
export const CONVERSATION_STACK_REST = 12;

/**
 * ChipReadout hides when `receivedAt + 30000` is due
 * (`setTimeout(max(0, receivedAt + 30000 - Date.now()))`).
 */
export const CHIP_READOUT_VISIBLE_MS = 30_000;

/** Shipped bubble exit is 0.35s; the deadline matches that hold. */
export const CONVERSATION_EXIT_MS = 350;

/** Shipped `layout` tween on conversation bubbles. */
export const CONVERSATION_LAYOUT_MS = 300;
export const CONVERSATION_LAYOUT_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

export function conversationStackOffset(visible: boolean): number {
  return visible ? CONVERSATION_STACK_LIFT : CONVERSATION_STACK_REST;
}

/** Visible while the controller readout exists and is not past its 30s deadline. */
export function isChipReadoutVisible(
  readout: { receivedAt: number } | null,
  now: number,
): boolean {
  return readout != null && now < readout.receivedAt + CHIP_READOUT_VISIBLE_MS;
}

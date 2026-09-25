export interface BountyExtensionFactTarget {
  emitFact(factId: string): Promise<unknown>;
}

/**
 * The shipped Browser treats permission acceptance as the user-visible result.
 * Fact persistence is best-effort: a transport failure does not turn an
 * accepted installation prompt into a rejection for the requesting page.
 */
export async function settleBountyExtensionInstall(
  target: BountyExtensionFactTarget,
  accepted: boolean,
): Promise<boolean> {
  if (accepted)
    await target.emitFact("bounty.ext_installed").catch(() => {});
  return accepted;
}

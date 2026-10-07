import { HttpCompatibilityError } from "../runtime/http";
import { createSourceTranslate } from "./translate";

export function localizeVersionConflict(locale = typeof document === "undefined" ? "en" : document.documentElement.lang): string {
  return createSourceTranslate(locale)("errors.stateChanged");
}

/** Keep transport diagnostics out of user-facing copy. */
export function localizeUserError(
  error: unknown, locale: string,
  action: "connection" | "sendCode" | "signIn" | "signOut",
): string {
  const t = createSourceTranslate(locale);
  if (error instanceof HttpCompatibilityError && error.status === 429)
    return t("errors.rateLimit");
  return t(`errors.${error instanceof TypeError ? "connection" : action}`);
}

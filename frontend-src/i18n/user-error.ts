import { HttpCompatibilityError } from "../runtime/http";
import { createSourceTranslate } from "./translate";

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

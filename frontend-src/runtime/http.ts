export interface LocalUser {
  id: string;
  name: string;
  email: string;
  image?: string;
  createdAt?: number;
}

export interface LocalSession {
  session: {
    id: string;
    userId: string;
    token: string;
    expiresAt: number;
  };
  user: LocalUser;
}

export interface ArcadeTicketResponse {
  ticket: string;
}

export interface ConvexResult<T = unknown> {
  status: "success" | "error";
  value?: T;
  errorMessage?: string;
  logLines?: string[];
}

export class HttpCompatibilityError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly payload: unknown,
  ) {
    super(message);
    this.name = "HttpCompatibilityError";
  }
}

export async function requestJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, init);
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    // Some compatibility endpoints may respond without a body on failure.
  }

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "message" in payload
        ? String((payload as { message?: unknown }).message ?? response.statusText)
        : response.statusText || `HTTP ${response.status}`;
    throw new HttpCompatibilityError(message, response.status, payload);
  }

  return payload as T;
}

export function getSession(): Promise<LocalSession | null> {
  return requestJson<LocalSession | null>("/api/auth/get-session");
}

export function issueArcadeTicket(): Promise<ArcadeTicketResponse> {
  return requestJson<ArcadeTicketResponse>("/api/arcade/ws-ticket", { method: "POST" });
}

export function convexCall<T = unknown>(path: string, args: unknown = {}): Promise<ConvexResult<T>> {
  return requestJson<ConvexResult<T>>("/api/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args }),
  });
}

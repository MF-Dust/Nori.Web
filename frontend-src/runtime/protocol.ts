export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type RequestId = string;
export type WorldId = string;
export type CartridgeId = string;

export interface CreateWorldMessage {
  type: "create_world";
  locale?: string;
}

export interface JoinWorldMessage {
  type: "join_world";
  worldId: WorldId;
}

export interface LeaveWorldMessage {
  type: "leave_world";
}

export interface OpenMyWebWorldMessage {
  type: "open_my_web_world";
  locale?: string;
}

export interface ResetMyWebWorldMessage {
  type: "reset_my_web_world";
  locale?: string;
}

export interface MountCartridgeMessage {
  type: "mount_cartridge";
  cartridgeId: CartridgeId;
  requestId: RequestId;
}

export interface UnmountCartridgeMessage {
  type: "unmount_cartridge";
  cartridgeId: CartridgeId;
  requestId: RequestId;
}

export interface DispatchMessage {
  type: "dispatch";
  actor: string;
  cartridgeId: CartridgeId;
  requestId: RequestId;
  expectedHeadVersion: number;
  cmd: { type: string; [key: string]: JsonValue };
}

export interface AdvanceVisibilityFenceMessage {
  type: "advance_visibility_fence";
  cartridgeId: CartridgeId;
  visibilityFenceId: string;
  requestId: RequestId;
  version: number;
}

export interface PingMessage {
  type: "ping";
}

export interface EventMessage {
  type: "event";
  channel: string;
  payload?: JsonValue;
  [key: string]: JsonValue | undefined;
}

export type ArcadeClientMessage =
  | CreateWorldMessage
  | JoinWorldMessage
  | LeaveWorldMessage
  | OpenMyWebWorldMessage
  | ResetMyWebWorldMessage
  | MountCartridgeMessage
  | UnmountCartridgeMessage
  | DispatchMessage
  | AdvanceVisibilityFenceMessage
  | PingMessage
  | EventMessage;

export interface RuntimeTransitionMessage {
  type: "runtime_transition";
  worldId: WorldId;
  cartridgeId: CartridgeId;
  version: number;
  transition: Record<string, JsonValue>;
}

export interface VisibilityFenceAdvancedMessage {
  type: "visibility_fence_advanced";
  worldId: WorldId;
  cartridgeId: CartridgeId;
  visibilityFenceId: string;
  visibleVersion: number;
  headVersion: number;
}

export interface DispatchAckMessage {
  type: "dispatch_ack";
  worldId: WorldId;
  cartridgeId: CartridgeId;
  requestId: RequestId;
  success: boolean;
  committed?: boolean;
  headVersion: number;
  committedVersion?: number;
  result?: JsonValue;
  error?: string;
  errorCode?: string;
  staleVisibilityFence?: Record<string, JsonValue>;
}

export interface ArcadeErrorMessage {
  type: "error";
  code: string;
  message: string;
  worldId?: WorldId;
  cartridgeId?: CartridgeId;
  requestId?: RequestId;
  details?: Record<string, JsonValue>;
}

export type ArcadeServerMessage =
  | RuntimeTransitionMessage
  | VisibilityFenceAdvancedMessage
  | DispatchAckMessage
  | ArcadeErrorMessage
  | ({ type: string } & Record<string, JsonValue>);

export const ARCADE_SUBPROTOCOL = "arcade.v1" as const;
export const ARCADE_MAIN_PATH = "/api/arcade/web/v1" as const;
export const ARCADE_MEDIA_PATH = "/api/arcade/web/v1/media" as const;
export const ARCADE_TICKET_PATH = "/api/arcade/ws-ticket" as const;

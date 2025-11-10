/**
 * Multiplayer message types for event-driven player synchronization
 */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

// ==================== CLIENT → SERVER ====================

export type ClientMessage = PlayerSpawnMessage | PlayerActionMessage;

export interface PlayerSpawnMessage {
  type: "player_spawn";
  position: Vec3;
  rotation: number;
}

export interface PlayerActionMessage {
  type: "player_action";
  action: "move" | "jump" | "throw";
  position: Vec3;
  rotation: number;
  velocity?: Vec3;
  direction?: Vec3; // For throw actions
}

// ==================== SERVER → CLIENT ====================

export type ServerMessage =
  | WelcomeMessage
  | PlayerJoinedMessage
  | PlayerLeftMessage
  | PlayerStateMessage
  | WorldSnapshotMessage
  | ChatMessage;

export interface WelcomeMessage {
  type: "welcome";
  player_id: string;
  name: string;
  character_id: string;
}

export interface PlayerJoinedMessage {
  type: "player_joined";
  player_id: string;
  name: string;
  character_id: string;
  position: Vec3;
  rotation: number;
}

export interface PlayerLeftMessage {
  type: "player_left";
  player_id: string;
}

export interface PlayerStateMessage {
  type: "player_state";
  player_id: string;
  action: "move" | "jump" | "throw";
  position: Vec3;
  rotation: number;
  velocity?: Vec3;
  direction?: Vec3; // For throw actions
}

export interface WorldSnapshotMessage {
  type: "world_snapshot";
  players: Array<{
    player_id: string;
    name: string;
    character_id: string;
    position: Vec3;
    rotation: number;
  }>;
}

export interface ChatMessage {
  type: "chat_message";
  data: {
    player_name: string;
    message: string;
    timestamp: number;
  };
}

export interface ChatErrorMessage {
  type: "chat_error";
  error: string;
}

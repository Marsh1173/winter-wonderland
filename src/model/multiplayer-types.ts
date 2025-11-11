/**
 * Multiplayer message types for event-driven player synchronization
 */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

// ==================== CLIENT → SERVER ====================

export type ClientMessage = PlayerActionMessage;

export interface PlayerActionMessage {
  type: "player_action";
  action: "move" | "jump" | "throw";
  position: Vec3;
  rotation: number;
  velocity: Vec3;
  direction?: number; // For snowball throw action
}

// ==================== SERVER → CLIENT ====================

export type ServerMessage = PlayerJoinedMessage | PlayerLeftMessage | PlayerStateMessage | WorldSnapshotMessage;

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
  velocity: Vec3;
  direction?: number; // For snowball throw action
}

export interface WorldSnapshotMessage {
  type: "world_snapshot";
  player_id: string;
  name: string;
  character_id: string;
  players: Array<{
    player_id: string;
    name: string;
    character_id: string;
    position: Vec3;
    rotation: number;
  }>;
}

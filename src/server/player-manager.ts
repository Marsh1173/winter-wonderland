import type { ServerWebSocket } from "bun";
import type { Vec3 } from "@/model/multiplayer-types";

export type PlayerData = {
  player_id: string;
  name: string;
  character_id: string;
};

export interface GamePlayerState {
  player_id: string;
  name: string;
  character_id: string;
  position: Vec3;
  rotation: number;
  velocity: Vec3;
  last_action: "move" | "jump" | "throw" | null;
  last_action_time: number;
}

export class PlayerManager {
  private players: Set<ServerWebSocket<PlayerData>> = new Set();
  private game_state: Map<string, GamePlayerState> = new Map();

  add_player(ws: ServerWebSocket<PlayerData>): void {
    this.players.add(ws);
  }

  remove_player(ws: ServerWebSocket<PlayerData>): void {
    this.players.delete(ws);
    this.game_state.delete(ws.data.player_id);
  }

  get_all_players(): ServerWebSocket<PlayerData>[] {
    return Array.from(this.players);
  }

  get_player_count(): number {
    return this.players.size;
  }

  broadcast_message(message: Record<string, any>): void {
    const json_payload = JSON.stringify(message);
    for (const socket of this.players) {
      try {
        socket.send(json_payload);
      } catch (error) {
        console.error(
          `Failed to send message to player ${socket.data.player_id}:`,
          error
        );
      }
    }
  }

  send_to_player(
    ws: ServerWebSocket<PlayerData>,
    message: Record<string, any>
  ): void {
    try {
      ws.send(JSON.stringify(message));
    } catch (error) {
      console.error(
        `Failed to send message to player ${ws.data.player_id}:`,
        error
      );
    }
  }

  update_player_state(player_id: string, state: Partial<GamePlayerState>, player_data: PlayerData): void {
    const existing_state = this.game_state.get(player_id) || {
      player_id,
      name: player_data.name,
      character_id: player_data.character_id,
      position: { x: 0, y: 1, z: 0 },
      rotation: 0,
      velocity: { x: 0, y: 0, z: 0 },
      last_action: null,
      last_action_time: Date.now(),
    };

    const updated_state: GamePlayerState = {
      ...existing_state,
      ...state,
      last_action_time: Date.now(),
    };

    this.game_state.set(player_id, updated_state);
  }

  get_player_state(player_id: string): GamePlayerState | undefined {
    return this.game_state.get(player_id);
  }

  get_world_snapshot(): GamePlayerState[] {
    return Array.from(this.game_state.values());
  }

  broadcast_player_action(sender_id: string, action: Record<string, any>): void {
    const json_payload = JSON.stringify(action);
    for (const socket of this.players) {
      // Send to all players except the sender (sender already has this state)
      if (socket.data.player_id !== sender_id) {
        try {
          socket.send(json_payload);
        } catch (error) {
          console.error(
            `Failed to send action to player ${socket.data.player_id}:`,
            error
          );
        }
      }
    }
  }

  log_connection(ws: ServerWebSocket<PlayerData>): void {
    console.log(
      `✅ Player connected: ${ws.data.player_id} (${ws.data.name}) - Total: ${this.get_player_count()}`
    );
  }

  log_disconnection(ws: ServerWebSocket<PlayerData>): void {
    console.log(
      `❌ Player disconnected: ${ws.data.player_id} - Total: ${this.get_player_count()}`
    );
  }
}

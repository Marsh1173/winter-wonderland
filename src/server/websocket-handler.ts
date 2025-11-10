import type { ServerWebSocket } from "bun";
import { handle_chat_message } from "./chat-handler";
import { PlayerManager, type PlayerData } from "./player-manager";
import type { PlayerSpawnMessage, PlayerActionMessage } from "@/model/multiplayer-types";

export class WebSocketHandler {
  private player_manager: PlayerManager;

  constructor(player_manager: PlayerManager) {
    this.player_manager = player_manager;
  }

  handle_open(ws: ServerWebSocket<PlayerData>): void {
    this.player_manager.add_player(ws);
    this.player_manager.log_connection(ws);

    // Initialize player state with default spawn position
    this.player_manager.update_player_state(
      ws.data.player_id,
      {
        position: { x: 0, y: 1, z: 0 },
        rotation: 0,
        velocity: { x: 0, y: 0, z: 0 },
        last_action: null,
      },
      ws.data
    );

    this.player_manager.send_to_player(ws, {
      type: "welcome",
      player_id: ws.data.player_id,
      name: ws.data.name,
      character_id: ws.data.character_id,
    });

    // Send world snapshot (all existing players except the newly connected one)
    const world_snapshot = this.player_manager
      .get_world_snapshot()
      .filter((state) => state.player_id !== ws.data.player_id);

    console.log(
      `🌍 Sending world snapshot to ${ws.data.player_id} with ${world_snapshot.length} players`
    );
    world_snapshot.forEach((state) => {
      console.log(`  - ${state.name} (${state.player_id})`);
    });

    this.player_manager.send_to_player(ws, {
      type: "world_snapshot",
      players: world_snapshot.map((state) => ({
        player_id: state.player_id,
        name: state.name,
        character_id: state.character_id,
        position: state.position,
        rotation: state.rotation,
      })),
    });

    // Broadcast player_joined to all other players
    const other_players = this.player_manager.get_all_players();
    for (const player_ws of other_players) {
      if (player_ws !== ws) {
        this.player_manager.send_to_player(player_ws, {
          type: "player_joined",
          player_id: ws.data.player_id,
          name: ws.data.name,
          character_id: ws.data.character_id,
          position: { x: 0, y: 1, z: 0 },
          rotation: 0,
        });
      }
    }
  }

  handle_message(ws: ServerWebSocket<PlayerData>, message: string | Buffer): void {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === "chat_message" && typeof data.message === "string") {
        this.handle_chat_message(ws, data.message);
      } else if (data.type === "player_spawn") {
        this.handle_player_spawn(ws, data as PlayerSpawnMessage);
      } else if (data.type === "player_action") {
        this.handle_player_action(ws, data as PlayerActionMessage);
      }
    } catch (error) {
      console.error(`Failed to parse message from ${ws.data.player_id}:`, error);
    }
  }

  handle_close(ws: ServerWebSocket<PlayerData>): void {
    const player_id = ws.data.player_id;
    this.player_manager.remove_player(ws);
    this.player_manager.log_disconnection(ws);

    // Broadcast player_left to all remaining players
    this.player_manager.broadcast_message({
      type: "player_left",
      player_id,
    });
  }

  private handle_player_spawn(ws: ServerWebSocket<PlayerData>, data: PlayerSpawnMessage): void {
    this.player_manager.update_player_state(
      ws.data.player_id,
      {
        position: data.position,
        rotation: data.rotation,
        velocity: { x: 0, y: 0, z: 0 },
        last_action: null,
      },
      ws.data
    );
  }

  private handle_player_action(ws: ServerWebSocket<PlayerData>, data: PlayerActionMessage): void {
    this.player_manager.update_player_state(
      ws.data.player_id,
      {
        position: data.position,
        rotation: data.rotation,
        velocity: data.velocity || { x: 0, y: 0, z: 0 },
        last_action: data.action,
      },
      ws.data
    );

    // Broadcast action to all other players
    this.player_manager.broadcast_player_action(ws.data.player_id, {
      type: "player_state",
      player_id: ws.data.player_id,
      action: data.action,
      position: data.position,
      rotation: data.rotation,
      velocity: data.velocity,
      direction: data.direction,
    });
  }

  private handle_chat_message(ws: ServerWebSocket<PlayerData>, text: string): void {
    const result = handle_chat_message(text, ws.data.player_id, ws.data.name);

    if (result.success && result.message) {
      console.log(`💬 Chat from ${ws.data.player_id}: ${result.message.message}`);
      this.player_manager.broadcast_chat(result.message);
    } else {
      this.player_manager.send_to_player(ws, {
        type: "chat_error",
        error: result.error,
      });
    }
  }
}

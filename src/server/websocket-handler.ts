import type { ServerWebSocket } from "bun";
import { handle_chat_message } from "./chat-handler";
import { PlayerManager, type PlayerData } from "./player-manager";

export class WebSocketHandler {
  private player_manager: PlayerManager;

  constructor(player_manager: PlayerManager) {
    this.player_manager = player_manager;
  }

  handle_open(ws: ServerWebSocket<PlayerData>): void {
    this.player_manager.add_player(ws);
    this.player_manager.log_connection(ws);

    this.player_manager.send_to_player(ws, {
      type: "welcome",
      player_id: ws.data.player_id,
      name: ws.data.name,
      character_id: ws.data.character_id,
    });
  }

  handle_message(ws: ServerWebSocket<PlayerData>, message: string | Buffer): void {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === "chat_message" && typeof data.message === "string") {
        this.handle_chat_message(ws, data.message);
      }
    } catch (error) {
      console.error(`Failed to parse message from ${ws.data.player_id}:`, error);
    }
  }

  handle_close(ws: ServerWebSocket<PlayerData>): void {
    this.player_manager.remove_player(ws);
    this.player_manager.log_disconnection(ws);
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

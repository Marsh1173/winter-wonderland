import type { ServerWebSocket } from "bun";
import type { ChatMessage } from "@/model/chat-types";

export type PlayerData = {
  player_id: string;
  name: string;
  character_id: string;
};

export class PlayerManager {
  private players: Set<ServerWebSocket<PlayerData>> = new Set();

  add_player(ws: ServerWebSocket<PlayerData>): void {
    this.players.add(ws);
  }

  remove_player(ws: ServerWebSocket<PlayerData>): void {
    this.players.delete(ws);
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

  broadcast_chat(message: ChatMessage): void {
    this.broadcast_message({
      type: "chat_message",
      data: message,
    });
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

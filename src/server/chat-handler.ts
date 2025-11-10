import type { ServerWebSocket } from "bun";
import type { ChatMessage, ChatMessagePayload } from "@/model/chat-types";
import { validate_chat_message } from "./types";

type PlayerData = {
  player_id: string;
  name: string;
  character_id: string;
};

/**
 * Handle incoming chat message
 */
export function handle_chat_message(
  text: string,
  player_id: string,
  player_name: string
): { success: boolean; message?: ChatMessage; error?: string } {
  // Validate and sanitize message
  const validation = validate_chat_message(text);
  if (!validation.success) {
    return { success: false, error: validation.error };
  }

  const chat_message: ChatMessage = {
    player_id,
    player_name,
    message: validation.data!,
    timestamp: Date.now(),
  };

  return { success: true, message: chat_message };
}

/**
 * Broadcast chat message to all connected players
 */
export function broadcast_chat_message(sockets: Set<ServerWebSocket<PlayerData>>, message: ChatMessage): void {
  const payload: ChatMessagePayload = {
    type: "chat_message",
    data: message,
  };

  const json_payload = JSON.stringify(payload);

  for (const socket of sockets) {
    try {
      socket.send(json_payload);
    } catch (error) {
      console.error(`Failed to send message to player ${socket.data.player_id}:`, error);
    }
  }
}

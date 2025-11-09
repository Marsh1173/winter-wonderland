import type { ServerWebSocket } from "bun";
import type { ChatMessage, ChatMessagePayload } from "@/model/chat-types";
import { validate_chat_message } from "./types";

type PlayerData = {
  player_id: string;
  name: string;
  character_id: string;
};

/**
 * Tracks rate limiting per player
 */
const rate_limiter = new Map<string, number[]>();

/**
 * Rate limiting configuration: max 5 messages per 5 seconds
 */
const RATE_LIMIT_MESSAGES = 5;
const RATE_LIMIT_WINDOW_MS = 5000;

/**
 * Check if a player has exceeded rate limit
 */
export function check_rate_limit(player_id: string): boolean {
  const now = Date.now();
  const timestamps = rate_limiter.get(player_id) ?? [];

  // Remove timestamps outside the window
  const recent = timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= RATE_LIMIT_MESSAGES) {
    return false; // Rate limited
  }

  // Add current timestamp and update
  recent.push(now);
  rate_limiter.set(player_id, recent);
  return true; // Not rate limited
}

/**
 * Handle incoming chat message
 */
export function handle_chat_message(
  text: string,
  player_id: string,
  player_name: string
): { success: boolean; message?: ChatMessage; error?: string } {
  // Check rate limit
  if (!check_rate_limit(player_id)) {
    return { success: false, error: "You are sending messages too quickly" };
  }

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
export function broadcast_chat_message(
  sockets: Set<ServerWebSocket<PlayerData>>,
  message: ChatMessage
): void {
  const payload: ChatMessagePayload = {
    type: "chat_message",
    data: message,
  };

  const json_payload = JSON.stringify(payload);

  for (const socket of sockets) {
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

import type { ChatMessage } from "@/model/chat-types";
import { ChatMessageValidator } from "@/model/chat-types";

export type ChatManagerConfig = {
  max_messages: number;
};

export class ChatManager {
  private messages: ChatMessage[] = [];
  private message_listeners: Set<(messages: ChatMessage[]) => void> = new Set();
  private error_listeners: Set<(error: string) => void> = new Set();
  private config: ChatManagerConfig;
  private ws: WebSocket;

  constructor(ws: WebSocket, config: ChatManagerConfig = { max_messages: 50 }) {
    this.ws = ws;
    this.config = config;
  }

  /**
   * Start listening to WebSocket messages
   */
  public start(): void {
    this.ws.addEventListener("message", this.handle_ws_message);
  }

  /**
   * Stop listening to WebSocket messages
   */
  public stop(): void {
    this.ws.removeEventListener("message", this.handle_ws_message);
  }

  /**
   * Send a chat message to the server
   */
  public send_message(text: string): void {
    if (!text.trim()) {
      this.emit_error("Message cannot be empty");
      return;
    }

    try {
      this.ws.send(
        JSON.stringify({
          type: "chat_message",
          message: text,
        })
      );
    } catch (error) {
      this.emit_error("Failed to send message");
      console.error("Chat send error:", error);
    }
  }

  /**
   * Get all messages
   */
  public get_messages(): ChatMessage[] {
    return [...this.messages];
  }

  /**
   * Subscribe to message updates
   */
  public on_messages_change(callback: (messages: ChatMessage[]) => void): () => void {
    this.message_listeners.add(callback);
    // Return unsubscribe function
    return () => {
      this.message_listeners.delete(callback);
    };
  }

  /**
   * Subscribe to error events
   */
  public on_error(callback: (error: string) => void): () => void {
    this.error_listeners.add(callback);
    // Return unsubscribe function
    return () => {
      this.error_listeners.delete(callback);
    };
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handle_ws_message = (event: Event): void => {
    try {
      const message_event = event as MessageEvent;
      const data = JSON.parse(message_event.data);

      // Check if it's a chat_message payload with ChatMessage data
      if (data.type === "chat_message" && data.data) {
        const chat_message = ChatMessageValidator.parse_object(data.data);
        this.add_message(chat_message);
      } else if (data.type === "chat_error") {
        this.emit_error(data.error || "Unknown error");
      }
    } catch (error) {
      console.error("Failed to parse chat message:", error);
    }
  };

  /**
   * Add a message to the history
   */
  private add_message(message: ChatMessage): void {
    this.messages.push(message);

    // Keep only the most recent messages
    if (this.messages.length > this.config.max_messages) {
      this.messages.shift();
    }

    this.emit_messages_change();
  }

  /**
   * Emit message change event
   */
  private emit_messages_change(): void {
    for (const listener of this.message_listeners) {
      listener([...this.messages]);
    }
  }

  /**
   * Emit error event
   */
  private emit_error(error: string): void {
    for (const listener of this.error_listeners) {
      listener(error);
    }
  }

  /**
   * Clear all messages
   */
  public clear(): void {
    this.messages = [];
    this.emit_messages_change();
  }
}

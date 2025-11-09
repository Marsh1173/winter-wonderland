import React, { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/model/chat-types";
import { ChatManager } from "./chat-manager";

interface ChatBoxProps {
  ws: WebSocket;
  player_name: string;
}

export const ChatBox: React.FC<ChatBoxProps> = ({ ws, player_name }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [is_typing, setIsTyping] = useState(false);
  const [input_value, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [error_timeout, setErrorTimeout] = useState<NodeJS.Timeout | null>(null);
  const chat_manager_ref = useRef<ChatManager | null>(null);
  const messages_end_ref = useRef<HTMLDivElement>(null);

  const input_ref = useRef<HTMLInputElement>(null);

  // Global keyboard listener for Enter key
  useEffect(() => {
    const handle_global_key = (e: KeyboardEvent) => {
      // Only trigger if the input is not currently focused
      if (e.key === "Enter" && !is_typing && document.activeElement !== input_ref.current) {
        e.preventDefault();
        setIsTyping(true);
        // Focus input on next render
        setTimeout(() => {
          input_ref.current?.focus();
        }, 0);
      }
    };

    window.addEventListener("keydown", handle_global_key);
    return () => window.removeEventListener("keydown", handle_global_key);
  }, [is_typing]);

  // Initialize chat manager
  useEffect(() => {
    const manager = new ChatManager(ws);
    chat_manager_ref.current = manager;
    manager.start();

    // Subscribe to message updates
    const unsub_messages = manager.on_messages_change((updated_messages) => {
      setMessages(updated_messages);
      // Auto-scroll to bottom
      setTimeout(() => {
        messages_end_ref.current?.scrollIntoView({ behavior: "smooth" });
      }, 0);
    });

    // Subscribe to errors
    const unsub_errors = manager.on_error((error_msg) => {
      setError(error_msg);
      if (error_timeout) clearTimeout(error_timeout);
      const timeout = setTimeout(() => {
        setError(null);
      }, 3000);
      setErrorTimeout(timeout);
    });

    return () => {
      manager.stop();
      unsub_messages();
      unsub_errors();
      if (error_timeout) clearTimeout(error_timeout);
    };
  }, [ws, error_timeout]);

  const handle_key_down = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // Send message if not empty, then close
      if (input_value.trim() && chat_manager_ref.current) {
        chat_manager_ref.current.send_message(input_value);
      }
      setInputValue("");
      setIsTyping(false);
    } else if (e.key === "Escape") {
      e.preventDefault();
      // Close without sending, keep text state
      setIsTyping(false);
    }
  };

  const handle_input_focus = () => {
    setIsTyping(true);
  };

  // HTML entity escape for safe display - only escape dangerous characters
  const escape_html = (text: string): string => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
    };
    return text.replace(/[&<>]/g, (char) => map[char]);
  };

  return (
    <div style={styles.container}>
      {/* Message History */}
      <div style={styles.messages_container}>
        {messages.map((msg, index) => (
          <div key={index} style={styles.message}>
            <span style={styles.player_name}>{escape_html(msg.player_name)}:</span>
            <span style={styles.message_text}> {escape_html(msg.message)}</span>
          </div>
        ))}
        <div ref={messages_end_ref} />
      </div>

      {/* Error message */}
      {error && <div style={styles.error_message}>{error}</div>}

      {/* Input area */}
      {!is_typing ? (
        <div style={styles.prompt}>Press Enter to chat...</div>
      ) : (
        <input
          ref={input_ref}
          type="text"
          value={input_value}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handle_key_down}
          onFocus={handle_input_focus}
          style={styles.input}
          autoFocus
        />
      )}
    </div>
  );
};

const styles = {
  container: {
    position: "fixed" as const,
    bottom: "0px",
    left: "0px",
    width: "350px",
    maxHeight: "300px",
    display: "flex",
    flexDirection: "column" as const,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    zIndex: 100,
    fontFamily: "Fredoka, sans-serif",
    pointerEvents: "none" as const,
  } as React.CSSProperties,
  messages_container: {
    flex: 1,
    overflowY: "auto" as const,
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
    padding: "8px",
    fontSize: "12px",
    minHeight: "80px",
    scrollbarColor: "#fff3 #0000",
    scrollbarWidth: "thin",
  } as React.CSSProperties,
  message: {
    display: "flex",
    gap: "4px",
    wordBreak: "break-word" as const,
    lineHeight: "1.4",
  } as React.CSSProperties,
  player_name: {
    color: "#a0d8ff",
    fontWeight: 600,
    flexShrink: 0,
  } as React.CSSProperties,
  message_text: {
    color: "#ffffff",
    flex: 1,
  } as React.CSSProperties,
  prompt: {
    padding: "8px",
    fontSize: "11px",
    color: "#888888",
    borderTop: "1px solid rgba(255, 255, 255, 0.05)",
  } as React.CSSProperties,
  input: {
    padding: "8px",
    fontSize: "12px",
    border: "none",
    borderTop: "1px solid rgba(255, 255, 255, 0.05)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    color: "white",
    outline: "none",
    fontFamily: "Fredoka, sans-serif",
  } as React.CSSProperties,
  error_message: {
    padding: "6px 8px",
    fontSize: "11px",
    color: "#ff6b6b",
    backgroundColor: "rgba(255, 68, 68, 0.1)",
    borderTop: "1px solid rgba(255, 68, 68, 0.2)",
    textAlign: "center" as const,
  } as React.CSSProperties,
};

import React, { useEffect, useRef, useState } from "react";
import type { PlayerData } from "../networking/websocket-client";
import { GameScene } from "../game/game-scene";
import type { WorldSnapshotMessage } from "@/model/multiplayer-types";
import { InteractablePrompt } from "./interactable-prompt";
import { ChatBubble } from "./chat-bubble";
import type { Interactable } from "../game/interactables-manager";

interface GameStateProps {
  ws: WebSocket;
  world_snapshot: WorldSnapshotMessage;
  on_disconnect: () => void;
}

export const GameState: React.FC<GameStateProps> = ({ ws, world_snapshot, on_disconnect }) => {
  const canvas_ref = useRef<HTMLCanvasElement>(null);
  const game_scene_ref = useRef<GameScene | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nearby_interactable, set_nearby_interactable] = useState<Interactable | null>(null);
  const [active_chat, set_active_chat] = useState<Interactable | null>(null);

  useEffect(() => {
    const handleClose = () => {
      console.log("WebSocket closed");
      on_disconnect();
    };

    const handleError = () => {
      console.error("WebSocket error");
      on_disconnect();
    };

    ws.addEventListener("close", handleClose);
    ws.addEventListener("error", handleError);

    return () => {
      ws.removeEventListener("close", handleClose);
      ws.removeEventListener("error", handleError);
    };
  }, [ws, on_disconnect]);

  useEffect(() => {
    if (!canvas_ref.current) return;

    const init_scene = async (canvas_ref_current: HTMLCanvasElement) => {
      try {
        const scene = new GameScene(canvas_ref_current, world_snapshot, ws);
        game_scene_ref.current = scene;

        await scene.load_world_environment();
        await scene.load_character();
        scene.start();
      } catch (err) {
        const error_msg = err instanceof Error ? err.message : "Failed to initialize scene";
        setError(error_msg);
        console.error("Scene initialization error:", err);
      }
    };

    init_scene(canvas_ref.current);

    return () => {
      if (game_scene_ref.current) {
        game_scene_ref.current.dispose();
        game_scene_ref.current = null;
      }
    };
  }, [world_snapshot, ws]);

  // Poll for nearby interactables and handle F key input
  useEffect(() => {
    const update_interval = setInterval(() => {
      if (!game_scene_ref.current) return;

      const nearby = game_scene_ref.current.get_nearby_interactable();
      set_nearby_interactable(nearby);

      // If player moved away from interactable, close chat
      if (active_chat && !nearby) {
        set_active_chat(null);
      } else if (active_chat && nearby && active_chat.id !== nearby.id) {
        // If player is near a different interactable, close current chat
        set_active_chat(null);
      }
    }, 16); // Update ~60 times per second

    return () => clearInterval(update_interval);
  }, [active_chat]);

  // Handle F key press for interaction
  useEffect(() => {
    const handle_keydown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "f") {
        if (nearby_interactable && !active_chat) {
          set_active_chat(nearby_interactable);
        } else if (active_chat) {
          set_active_chat(null);
        }
      }
    };

    window.addEventListener("keydown", handle_keydown);
    return () => window.removeEventListener("keydown", handle_keydown);
  }, [nearby_interactable, active_chat]);

  return (
    <div style={styles.container}>
      <canvas ref={canvas_ref} style={styles.canvas} />

      {error && <div style={styles.error}>Error: {error}</div>}

      {nearby_interactable && !active_chat && <InteractablePrompt name={nearby_interactable.name} />}

      {active_chat && (
        <ChatBubble
          name={active_chat.name}
          text={active_chat.text}
          on_close={() => set_active_chat(null)}
        />
      )}
    </div>
  );
};

const styles = {
  container: {
    width: "100%",
    height: "100vh",
    position: "relative" as const,
    overflow: "hidden",
  } as React.CSSProperties,
  canvas: {
    display: "block",
    width: "100%",
    height: "100%",
    margin: 0,
    padding: 0,
  } as React.CSSProperties,
  loading: {
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    fontSize: "1.5rem",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    padding: "2rem",
    borderRadius: "8px",
    zIndex: 10,
  } as React.CSSProperties,
  error: {
    position: "absolute" as const,
    top: "20px",
    left: "20px",
    backgroundColor: "rgba(255, 68, 68, 0.9)",
    color: "#ff6b6b",
    padding: "1rem",
    borderRadius: "8px",
    maxWidth: "300px",
    zIndex: 10,
  } as React.CSSProperties,
};

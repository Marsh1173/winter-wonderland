import React, { useEffect, useRef, useState } from "react";
import type { PlayerData } from "./websocket-client";
import { GameScene } from "./game-scene";
import { ChatBox } from "./chat/chat-box";

interface GameStateProps {
  ws: WebSocket;
  player_data: PlayerData;
  on_disconnect: () => void;
}

export const GameState: React.FC<GameStateProps> = ({ ws, player_data, on_disconnect }) => {
  const canvas_ref = useRef<HTMLCanvasElement>(null);
  const game_scene_ref = useRef<GameScene | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

    const init_scene = async () => {
      try {
        const scene = new GameScene(canvas_ref.current!, player_data.character_id);
        game_scene_ref.current = scene;

        // Load character model
        await scene.load_character();

        // Start render loop
        scene.start();
        setLoading(false);
      } catch (err) {
        const error_msg = err instanceof Error ? err.message : "Failed to initialize scene";
        setError(error_msg);
        console.error("Scene initialization error:", err);
      }
    };

    init_scene();

    return () => {
      if (game_scene_ref.current) {
        game_scene_ref.current.dispose();
        game_scene_ref.current = null;
      }
    };
  }, [player_data.character_id]);

  return (
    <div style={styles.container}>
      <canvas ref={canvas_ref} style={styles.canvas} />

      {loading && <div style={styles.loading}>Loading world...</div>}
      {error && <div style={styles.error}>Error: {error}</div>}

      <div style={styles.hud}>
        <div style={styles.player_info}>
          <h2>{player_data.name}</h2>
          <p>Character: {player_data.character_id}</p>
        </div>
      </div>

      <ChatBox ws={ws} player_name={player_data.name} />
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
  hud: {
    position: "absolute" as const,
    top: "20px",
    right: "20px",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: "1rem",
    borderRadius: "8px",
    minWidth: "200px",
    zIndex: 10,
  } as React.CSSProperties,
  player_info: {
    textAlign: "right" as const,
  } as React.CSSProperties,
};

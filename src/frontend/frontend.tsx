import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { LoadingState } from "./LoadingState";
import { CharacterSelectState } from "./CharacterSelectState";
import { GameState } from "./GameState";
import type { PlayerData } from "./websocket-client";
import "./index.css";

type AppState =
  | { type: "loading" }
  | { type: "character-select" }
  | { type: "game"; player_data: PlayerData; websocket: WebSocket };

function App() {
  const [app_state, set_app_state] = useState<AppState>({ type: "loading" });

  return (
    <StrictMode>
      {app_state.type === "loading" && (
        <LoadingState on_loading_complete={() => set_app_state({ type: "character-select" })} />
      )}
      {app_state.type === "character-select" && (
        <CharacterSelectState
          on_character_selected={(ws, player) => {
            set_app_state({ type: "game", player_data: player, websocket: ws });
          }}
        />
      )}
      {app_state.type === "game" && (
        <GameState
          ws={app_state.websocket}
          player_data={app_state.player_data}
          on_disconnect={() => set_app_state({ type: "character-select" })}
        />
      )}
    </StrictMode>
  );
}

const elem = document.getElementById("root")!;

if (import.meta.hot) {
  // With hot module reloading, `import.meta.hot.data` is persisted.
  const root = (import.meta.hot.data.root ??= createRoot(elem));
  root.render(<App />);
} else {
  // The hot module reloading API is not available in production.
  createRoot(elem).render(<App />);
}

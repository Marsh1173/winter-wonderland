import { useState } from "react";
import { createRoot } from "react-dom/client";
import { LoadingState } from "./ui/loading-state";
import { CharacterSelectState } from "./ui/character-select-state";
import { GameState } from "./ui/game-state";
import type { PlayerData } from "./networking/websocket-client";
import "./index.css";
import type { WorldSnapshotMessage } from "@/model/multiplayer-types";

type AppState =
  | { type: "loading" }
  | { type: "character-select" }
  | { type: "game"; world_snapshot: WorldSnapshotMessage; websocket: WebSocket };

function App() {
  const [app_state, set_app_state] = useState<AppState>({ type: "loading" });

  return (
    <>
      {app_state.type === "loading" && (
        <LoadingState on_loading_complete={() => set_app_state({ type: "character-select" })} />
      )}
      {app_state.type === "character-select" && (
        <CharacterSelectState
          on_world_joined={(ws, world_snapshot) => {
            set_app_state({ type: "game", world_snapshot: world_snapshot, websocket: ws });
          }}
        />
      )}
      {app_state.type === "game" && (
        <GameState
          ws={app_state.websocket}
          world_snapshot={app_state.world_snapshot}
          on_disconnect={() => set_app_state({ type: "character-select" })}
        />
      )}
    </>
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

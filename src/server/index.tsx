import { serve } from "bun";
import { SERVER_CONFIG } from "./config";
import { type PlayerData, PlayerManager } from "./player-manager";
import { WebSocketHandler } from "./websocket-handler";
import { handle_assets_route, handle_connect_route } from "./route-handler";
import index from "../frontend/index.html";

const player_manager = new PlayerManager();
const ws_handler = new WebSocketHandler(player_manager);

const server = serve<PlayerData>({
  hostname: SERVER_CONFIG.hostname,
  port: SERVER_CONFIG.port,

  routes: {
    "/": index,
    "/assets/*": (request) => handle_assets_route(request),
    "/connect": (request, server) => handle_connect_route(request, server),
  },

  websocket: {
    open: (ws) => ws_handler.handle_open(ws),
    message: (ws, message) => ws_handler.handle_message(ws, message),
    close: (ws) => ws_handler.handle_close(ws),
  },

  development: SERVER_CONFIG.development,
});

console.log(`🚀 Server running at ${server.url}`);

import { resolve, join } from "path";
import type { Server } from "bun";
import { validate_connect_params } from "./types";
import type { PlayerData } from "./player-manager";

const assets_dir = resolve(import.meta.dir, "..", "assets");

export function generate_player_id(): string {
  return `player_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

export function handle_assets_route(request: Request): Response {
  const url = new URL(request.url);
  const asset_path = decodeURIComponent(url.pathname.slice(1));
  const full_path = resolve(join(import.meta.dir, "..", asset_path));

  if (!full_path.startsWith(assets_dir)) {
    return new Response("Forbidden", { status: 403 });
  }

  return new Response(Bun.file(full_path));
}

export function handle_connect_route(request: Request, server: Server<PlayerData>): Response | undefined {
  const url = new URL(request.url);
  const validation = validate_connect_params(url.searchParams);

  if (!validation.success) {
    return new Response(JSON.stringify({ error: validation.error }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const player_id = generate_player_id();
  const player_data: PlayerData = {
    player_id,
    name: validation.data!.name,
    character_id: validation.data!.character_id,
  };

  const success = server.upgrade(request, { data: player_data });
  if (success) {
    return undefined;
  }

  return new Response(JSON.stringify({ error: "Failed to upgrade connection" }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}

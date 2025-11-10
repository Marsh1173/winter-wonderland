export interface PlayerData {
  player_id: string;
  name: string;
  character_id: string;
}

export interface ConnectionResult {
  ws: WebSocket;
  player_data: PlayerData;
}

export async function connect_to_server(name: string, character_id: string): Promise<ConnectionResult> {
  return new Promise((resolve, reject) => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${protocol}//${window.location.host}/connect?name=${encodeURIComponent(name)}&character_id=${encodeURIComponent(character_id)}`;

    const ws = new WebSocket(url);

    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error("Connection timeout"));
    }, 5000);

    ws.onopen = () => {
      clearTimeout(timeout);
    };

    ws.onmessage = (event) => {
      clearTimeout(timeout);
      try {
        const message = JSON.parse(event.data);

        if (message.type === "welcome") {
          const player_data: PlayerData = {
            player_id: message.player_id,
            name: message.name,
            character_id: message.character_id,
          };

          resolve({
            ws,
            player_data,
          });
        }
      } catch (error) {
        console.error("Failed to parse message:", error);
        reject(new Error("Failed to parse server response"));
      }
    };

    ws.onerror = () => {
      clearTimeout(timeout);
      reject(new Error("WebSocket error"));
    };

    ws.onclose = () => {
      clearTimeout(timeout);
      reject(new Error("Connection closed"));
    };
  });
}

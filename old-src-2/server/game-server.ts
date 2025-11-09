import { Node3D } from "old-src-2/model/node3d.n";
import { BackendEnvironment } from "old-src-2/model/runtime/backend/backend-environment";
import { Engine } from "old-src-2/model/runtime/engine";
/**
 * Standalone game server that runs the game simulation on the backend
 * This is useful for:
 * - Authoritative server-side simulation for multiplayer games
 * - Headless game running for testing or AI training
 * - Deterministic replay and debugging
 */

async function runGameServer() {
  console.log("Initializing backend game server...");

  // Create backend environment (no rendering, no input)
  const environment = new BackendEnvironment(120);

  // Create engine
  const engine = new Engine(environment);

  // Initialize environment
  await engine.init();

  // Set up some example game objects
  const root = engine.getRootNode();

  // Create a simple test cube
  const cube = new Node3D("TestCube", {
    position: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
  });

  // Add a simple rotation behavior
  let rotationSpeed = 1.0; // radians per second
  cube._process = function (delta: number) {
    this.rotate({ x: 0, y: rotationSpeed * delta, z: 0 });
  };

  root.add_child(cube);

  // Start the engine
  engine.start();
  console.log("Game server started");

  // Optional: Log server status every second
  let frameCount = 0;
  const statusInterval = setInterval(() => {
    frameCount++;
    if (frameCount % 60 === 0) {
      const pos = cube.position;
      const rot = cube.rotation;
      console.log(
        `[Server] Frame ${frameCount} | Cube pos: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(
          2
        )}) | rot: (${rot.x.toFixed(2)}, ${rot.y.toFixed(2)}, ${rot.z.toFixed(2)})`
      );
    }
  }, 100);

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\nShutting down game server...");
    clearInterval(statusInterval);
    await engine.shutdown();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log("\nShutting down game server...");
    clearInterval(statusInterval);
    await engine.shutdown();
    process.exit(0);
  });
}

// Run the server
runGameServer().catch((error) => {
  console.error("Failed to start game server:", error);
  process.exit(1);
});

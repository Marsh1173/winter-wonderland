import type { IEnvironment } from "./environment";
import { Node } from "old-src-2/model/node.n";

/**
 * The main game engine that orchestrates the game loop
 * Takes an IEnvironment for cross-platform compatibility
 */
export class Engine {
  private readonly rootNode: Node;
  private running = false;
  private deltaTime = 0;

  constructor(private environment: IEnvironment) {
    this.rootNode = new Node("root");
  }

  /**
   * Initialize the engine and environment
   */
  async init(): Promise<void> {
    await this.environment.init();
  }

  /**
   * Start the game loop
   */
  start(): void {
    if (this.running) return;

    this.running = true;
    this.environment.ticker.start((deltaMs) => {
      this.deltaTime = deltaMs / 1000; // Convert to seconds
      this.update();
      this.render();
    });
  }

  /**
   * Stop the game loop
   */
  stop(): void {
    if (!this.running) return;

    this.running = false;
    this.environment.ticker.stop();
  }

  /**
   * Get the root node of the scene tree
   */
  getRootNode(): Node {
    return this.rootNode;
  }

  /**
   * Get the current delta time in seconds
   */
  getDeltaTime(): number {
    return this.deltaTime;
  }

  /**
   * Check if engine is running
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Get the environment
   */
  getEnvironment(): IEnvironment {
    return this.environment;
  }

  /**
   * Shutdown the engine and environment
   */
  async shutdown(): Promise<void> {
    this.stop();
    await this.environment.shutdown();
  }

  /**
   * Update game logic (process all nodes)
   */
  private update(): void {
    this.rootNode._process_inner(this.deltaTime);
  }

  /**
   * Render the scene
   */
  private render(): void {
    this.environment.renderer.render(this.rootNode);
  }
}

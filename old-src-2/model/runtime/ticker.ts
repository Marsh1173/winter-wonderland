/**
 * ITicker defines the contract for frame loop implementations.
 * Different environments (browser, server) provide different implementations.
 */
export interface ITicker {
  /**
   * Start the game loop, calling callback with delta time each frame
   * @param callback Function called each frame with delta time in milliseconds
   */
  start(callback: (delta_ms: number) => void): void;

  /**
   * Stop the game loop
   */
  stop(): void;

  /**
   * Check if the ticker is currently running
   */
  is_running(): boolean;
}

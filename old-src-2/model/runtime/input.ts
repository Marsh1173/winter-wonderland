import type { Vector2D } from "../types/vector2d";

/**
 * IInput defines the contract for input handling across environments.
 * Frontend provides real input, backend provides no-op implementations.
 */
export interface IInput {
  /**
   * Check if a key is currently pressed
   * @param key Key name (e.g., "ArrowUp", "Space", "w")
   * @returns True if key is pressed, false otherwise
   */
  is_key_pressed(key: string): boolean;

  /**
   * Get current mouse/pointer position in screen space
   * @returns Vector2D with x, y coordinates
   */
  get_mouse_position(): Vector2D;

  /**
   * Clean up input listeners
   */
  destroy(): void;
}

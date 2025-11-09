import type { Node } from "../node.n";

/**
 * IRenderer defines the contract for rendering implementations.
 * Frontend renders with Three.js, backend is a no-op.
 */
export interface IRenderer {
  /**
   * Render a frame with the current scene state
   * @param root_node Root of the scene tree to render
   */
  render(root_node: Node): void;

  /**
   * Clear the current scene/buffer
   */
  clear(): void;

  /**
   * Clean up renderer resources
   */
  destroy(): void;
}

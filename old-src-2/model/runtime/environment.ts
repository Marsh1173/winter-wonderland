import type { IInput } from "./input";
import type { IRenderer } from "./renderer";
import type { ITicker } from "./ticker";

/**
 * IEnvironment is the main contract that abstracts platform differences.
 * Implementations exist for browser (frontend) and server (backend).
 */
export interface IEnvironment {
  /**
   * The frame timing system (RAF for browser, setInterval for server)
   */
  ticker: ITicker;

  /**
   * Input handling system (keyboard/mouse for browser, no-op for server)
   */
  input: IInput;

  /**
   * Rendering system (Three.js for browser, no-op for server)
   */
  renderer: IRenderer;

  /**
   * Initialize the environment (set up DOM listeners, WebGL context, etc.)
   */
  init(): Promise<void>;

  /**
   * Shutdown the environment and clean up resources
   */
  shutdown(): Promise<void>;

  /**
   * Get the environment type for debugging/conditional logic if needed
   */
  get_type(): "browser" | "server";
}

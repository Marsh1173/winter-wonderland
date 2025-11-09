import type { Vector2D } from "old-src-2/model/types/vector2d";
import type { IInput } from "../input";

/**
 * No-op input handler for server environment
 * Always returns false/empty since server has no input devices
 */
export class NullInput implements IInput {
  public is_key_pressed(key: string): boolean {
    return false;
  }

  public get_mouse_position(): Vector2D {
    return { x: 0, y: 0 };
  }

  public destroy(): void {
    // No-op
  }
}

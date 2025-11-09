import type { Vector2D } from "old-src-2/model/types/vector2d";
import type { IInput } from "../input";

/**
 * Browser-based input handler supporting keyboard and mouse input
 */
export class BrowserInput implements IInput {
  private pressed_keys = new Set<string>();
  private mouse_position: Vector2D = { x: 0, y: 0 };
  private listeners: {
    type: string;
    handler: (event: any) => void;
  }[] = [];

  constructor() {
    this.setupListeners();
  }

  private setupListeners(): void {
    // Keyboard events
    const handleKeyDown = (e: KeyboardEvent) => {
      this.pressed_keys.add(e.key);
      this.emit("keydown", e);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      this.pressed_keys.delete(e.key);
      this.emit("keyup", e);
    };

    // Mouse events
    const handleMouseMove = (e: MouseEvent) => {
      this.mouse_position = {
        x: e.clientX,
        y: e.clientY,
      };
      this.emit("mousemove", e);
    };

    const handleMouseDown = (e: MouseEvent) => {
      this.emit("mousedown", e);
    };

    const handleMouseUp = (e: MouseEvent) => {
      this.emit("mouseup", e);
    };

    // Register listeners
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);

    // Store for cleanup
    this.listeners.push(
      { type: "keydown", handler: handleKeyDown },
      { type: "keyup", handler: handleKeyUp },
      { type: "mousemove", handler: handleMouseMove },
      { type: "mousedown", handler: handleMouseDown },
      { type: "mouseup", handler: handleMouseUp }
    );
  }

  public is_key_pressed(key: string): boolean {
    return this.pressed_keys.has(key);
  }

  public get_mouse_position(): Vector2D {
    return { ...this.mouse_position };
  }

  private emit(eventType: string, event: any): void {
    // Send input event down the pipeline
    // const customEvent = new CustomEvent("gameinput", {
    //   detail: { type: eventType, event },
    // });
    // this.element.dispatchEvent(customEvent);
  }

  public destroy(): void {
    for (const listener of this.listeners) {
      document.removeEventListener(listener.type, listener.handler);
    }
  }
}

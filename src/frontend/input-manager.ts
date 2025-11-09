export class InputManager {
  private keys_pressed: Set<string> = new Set();
  private mouse_delta = { x: 0, y: 0 };
  private pointer_lock_enabled = false;
  private canvas: HTMLCanvasElement;

  private on_keydown = (e: KeyboardEvent) => this.handle_keydown(e);
  private on_keyup = (e: KeyboardEvent) => this.handle_keyup(e);
  private on_pointerlockchange = () => this.handle_pointerlockchange();
  private on_mousemove = (e: MouseEvent) => this.handle_mousemove(e);
  private on_canvas_click = () => this.canvas.requestPointerLock();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  init(): void {
    window.addEventListener("keydown", this.on_keydown);
    window.addEventListener("keyup", this.on_keyup);
    document.addEventListener("pointerlockchange", this.on_pointerlockchange);
    document.addEventListener("mousemove", this.on_mousemove);
    this.canvas.addEventListener("click", this.on_canvas_click);
  }

  private handle_keydown(e: KeyboardEvent): void {
    this.keys_pressed.add(e.key.toLowerCase());
  }

  private handle_keyup(e: KeyboardEvent): void {
    this.keys_pressed.delete(e.key.toLowerCase());
  }

  private handle_pointerlockchange(): void {
    this.pointer_lock_enabled = document.pointerLockElement === this.canvas;
  }

  private handle_mousemove(e: MouseEvent): void {
    if (this.pointer_lock_enabled) {
      this.mouse_delta.x = e.movementX;
      this.mouse_delta.y = e.movementY;
    }
  }

  is_key_pressed(key: string): boolean {
    return this.keys_pressed.has(key.toLowerCase());
  }

  get_mouse_delta(): { x: number; y: number } {
    return this.mouse_delta;
  }

  reset_mouse_delta(): void {
    this.mouse_delta.x = 0;
    this.mouse_delta.y = 0;
  }

  is_pointer_locked(): boolean {
    return this.pointer_lock_enabled;
  }

  dispose(): void {
    window.removeEventListener("keydown", this.on_keydown);
    window.removeEventListener("keyup", this.on_keyup);
    document.removeEventListener("pointerlockchange", this.on_pointerlockchange);
    document.removeEventListener("mousemove", this.on_mousemove);
    this.canvas.removeEventListener("click", this.on_canvas_click);
  }
}

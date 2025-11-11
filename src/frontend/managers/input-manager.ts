export class InputManager {
  private keys_pressed: Set<string> = new Set();

  private on_keydown = (e: KeyboardEvent) => this.handle_keydown(e);
  private on_keyup = (e: KeyboardEvent) => this.handle_keyup(e);

  init(): void {
    window.addEventListener("keydown", this.on_keydown);
    window.addEventListener("keyup", this.on_keyup);
  }

  private handle_keydown(e: KeyboardEvent): void {
    this.keys_pressed.add(e.key.toLowerCase());
  }

  private handle_keyup(e: KeyboardEvent): void {
    this.keys_pressed.delete(e.key.toLowerCase());
  }

  is_key_pressed(key: string): boolean {
    return this.keys_pressed.has(key.toLowerCase());
  }

  dispose(): void {
    window.removeEventListener("keydown", this.on_keydown);
    window.removeEventListener("keyup", this.on_keyup);
  }
}

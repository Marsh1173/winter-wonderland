import type { ITicker } from "../ticker";

/**
 * Browser-based ticker using requestAnimationFrame for optimal performance
 */
export class BrowserTicker implements ITicker {
  private callback?: (delta_ms: number) => void;
  private running = false;
  private last_frame_time = 0;
  private raf_id: number | undefined = undefined;

  public start(callback: (delta_ms: number) => void): void {
    if (this.running) return;

    this.callback = callback;
    this.running = true;
    this.last_frame_time = performance.now();

    const tick = (current_time: number) => {
      const delta_ms = current_time - this.last_frame_time;
      this.last_frame_time = current_time;

      this.callback?.(delta_ms);

      if (this.running) {
        this.raf_id = requestAnimationFrame(tick);
      }
    };

    this.raf_id = requestAnimationFrame(tick);
  }

  public stop(): void {
    this.running = false;
    if (this.raf_id !== undefined) {
      cancelAnimationFrame(this.raf_id);
      this.raf_id = undefined;
    }
  }

  public is_running(): boolean {
    return this.running;
  }
}

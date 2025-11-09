import type { ITicker } from "../ticker";

/**
 * Server-based ticker using setInterval for consistent frame timing
 * Measures actual elapsed time between frames rather than assuming fixed deltas
 * Runs at ~60 FPS by default (16.67ms per frame)
 */
export class ServerTicker implements ITicker {
  private callback?: (delta_ms: number) => void;
  private running = false;
  private interval_id: NodeJS.Timeout | null = null;
  private readonly target_frame_ms: number;
  private last_frame_time: number = 0;

  constructor(target_fps: number = 60) {
    this.target_frame_ms = 1000 / target_fps;
  }

  public start(callback: (delta_ms: number) => void): void {
    if (this.running) return;

    this.callback = callback;
    this.running = true;
    this.last_frame_time = performance.now();

    this.interval_id = setInterval(() => {
      const now = performance.now();
      const delta_ms = now - this.last_frame_time;
      this.last_frame_time = now;

      this.callback?.(delta_ms);
    }, this.target_frame_ms);
  }

  public stop(): void {
    this.running = false;
    if (this.interval_id !== null) {
      clearInterval(this.interval_id);
      this.interval_id = null;
    }
  }

  public is_running(): boolean {
    return this.running;
  }
}

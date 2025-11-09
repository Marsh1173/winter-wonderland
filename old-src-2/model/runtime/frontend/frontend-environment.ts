import type { IEnvironment } from "../environment";
import { BrowserTicker } from "./browser-ticker";
import { BrowserInput } from "./browser-input";
import { ThreeJSRenderer } from "./threejs-renderer";

/**
 * Frontend environment combining browser-based ticker, input, and Three.js renderer
 * This is what the game engine uses when running in the browser
 */
export class FrontendEnvironment implements IEnvironment {
  public readonly ticker: BrowserTicker;
  public readonly input: BrowserInput;
  public readonly renderer: ThreeJSRenderer;

  constructor(private canvas: HTMLCanvasElement) {
    this.ticker = new BrowserTicker();
    this.input = new BrowserInput();
    this.renderer = new ThreeJSRenderer(this.canvas);
  }

  public async init(): Promise<void> {
    // Browser environment doesn't need async initialization
    // But keep the interface consistent
    console.log("Frontend environment initialized");
  }

  public async shutdown(): Promise<void> {
    this.ticker.stop();
    this.input.destroy();
    this.renderer.destroy();
    console.log("Frontend environment shutdown");
  }

  public get_type(): "browser" | "server" {
    return "browser";
  }
}

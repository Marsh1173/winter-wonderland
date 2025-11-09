import { ServerTicker } from "./server-ticker";
import { NullInput } from "./null-input";
import { NullRenderer } from "./null-renderer";
import type { IEnvironment } from "../environment";

/**
 * Backend environment combining server ticker with no-op input and renderer
 * This is what the game engine uses when running on the server
 */
export class BackendEnvironment implements IEnvironment {
  public readonly ticker: ServerTicker;
  public readonly input: NullInput;
  public readonly renderer: NullRenderer;

  constructor(target_fps: number = 60) {
    this.ticker = new ServerTicker(target_fps);
    this.input = new NullInput();
    this.renderer = new NullRenderer();
  }

  public async init() {
    console.log("Backend environment initialized");
  }

  public async shutdown() {
    this.ticker.stop();
    console.log("Backend environment shutdown");
  }

  public get_type(): "browser" | "server" {
    return "server";
  }
}

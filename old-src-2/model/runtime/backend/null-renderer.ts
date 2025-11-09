import { Node } from "old-src-2/model/node.n";
import type { IRenderer } from "../renderer";

/**
 * No-op renderer for server environment
 * Performs no actual rendering since there's no display
 */
export class NullRenderer implements IRenderer {
  public render(root_node: Node): void {
    // No-op: server doesn't render anything
  }

  public clear(): void {
    // No-op
  }

  public destroy(): void {
    // No-op
  }
}

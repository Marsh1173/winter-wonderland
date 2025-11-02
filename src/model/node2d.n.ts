import { Node } from "./node.n";
import type { Vector2D } from "./types/vector2d";

export interface Node2DProps {
  position?: Vector2D;
}

export class Node2D extends Node {
  public position: Vector2D;

  constructor(name: string, props: Node2DProps) {
    super(name);

    this.position = props.position ?? { x: 0, y: 0 };
  }
}

import { Node } from "./node.n";
import type { Vector3D } from "./types/vector3d";

/**
 * Properties for configuring a Node3D
 */
export interface Node3DProps {
  position?: Vector3D;
  rotation?: Vector3D;
  scale?: Vector3D;
}

/**
 * Node3D represents a 3D game object in the scene tree
 * Extends Node with 3D transformation properties
 */
export class Node3D extends Node {
  public position: Vector3D;
  public rotation: Vector3D;
  public scale: Vector3D;

  constructor(name: string, props: Node3DProps = {}) {
    super(name);

    this.position = props.position || { x: 0, y: 0, z: 0 };
    this.rotation = props.rotation || { x: 0, y: 0, z: 0 };
    this.scale = props.scale || { x: 1, y: 1, z: 1 };
  }

  /**
   * Translate the node by a delta
   */
  public translate(delta: Vector3D): void {
    this.position.x += delta.x;
    this.position.y += delta.y;
    this.position.z += delta.z;
  }

  /**
   * Rotate the node by a delta
   */
  public rotate(delta: Vector3D): void {
    this.rotation.x += delta.x;
    this.rotation.y += delta.y;
    this.rotation.z += delta.z;
  }

  /**
   * Scale the node by a multiplier
   */
  public scaleMul(factor: Vector3D): void {
    this.scale.x *= factor.x;
    this.scale.y *= factor.y;
    this.scale.z *= factor.z;
  }
}

import { Node3D, type Node3DProps } from "./node3d.n";
import type { Vector3D } from "./types/vector3d";

export interface CameraNodeProps extends Node3DProps {
  fov?: number;
}

export class CameraNode extends Node3D {
  public fov: number;

  constructor(name: string, props: CameraNodeProps = {}) {
    super(name, props);

    this.fov = props.fov || 75;
  }

  public override _ready(): void {
    // If game doesn't have a set camera, set this as the current camera
  }
}

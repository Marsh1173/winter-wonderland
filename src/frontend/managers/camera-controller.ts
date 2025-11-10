import * as THREE from "three";
import * as CANNON from "cannon-es";

export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private readonly camera_distance = 4;
  private readonly camera_height = 5;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
  }

  update(player_body: CANNON.Body): void {
    this.update_position(player_body);
  }

  private update_position(player_body: CANNON.Body): void {
    const player_pos = new THREE.Vector3(
      player_body.position.x,
      player_body.position.y,
      player_body.position.z
    );

    const camera_offset = new THREE.Vector3(0, this.camera_height, this.camera_distance);
    this.camera.position.copy(player_pos).add(camera_offset);
    this.camera.lookAt(player_pos.x, player_pos.y, player_pos.z);
  }

  get_forward_direction(): THREE.Vector3 {
    return new THREE.Vector3(0, 0, -1);
  }

  get_right_direction(): THREE.Vector3 {
    return new THREE.Vector3(1, 0, 0);
  }
}

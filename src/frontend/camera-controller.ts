import * as THREE from "three";
import * as CANNON from "cannon-es";

export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private euler = { x: 0, y: 0 };
  private sensitivity = 0.005;
  private camera_distance = 3;
  private camera_height = 0.5;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
  }

  update(player_body: CANNON.Body, mouse_delta: { x: number; y: number }): void {
    this.update_rotation(mouse_delta);
    this.update_position(player_body);
  }

  private update_rotation(mouse_delta: { x: number; y: number }): void {
    this.euler.y -= mouse_delta.x * this.sensitivity;
    this.euler.x -= mouse_delta.y * this.sensitivity;

    this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));
  }

  private update_position(player_body: CANNON.Body): void {
    const player_pos = new THREE.Vector3(
      player_body.position.x,
      player_body.position.y,
      player_body.position.z
    );

    const camera_offset = new THREE.Vector3(
      Math.sin(this.euler.y) * Math.cos(this.euler.x) * this.camera_distance,
      Math.sin(this.euler.x) * this.camera_distance + this.camera_height,
      Math.cos(this.euler.y) * Math.cos(this.euler.x) * this.camera_distance
    );

    this.camera.position.copy(player_pos).add(camera_offset);
    this.camera.lookAt(player_pos.x, player_pos.y + 0.5, player_pos.z);
  }

  get_forward_direction(): THREE.Vector3 {
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    return new THREE.Vector3(direction.x, 0, direction.z).normalize();
  }

  get_right_direction(): THREE.Vector3 {
    const forward = this.get_forward_direction();
    return new THREE.Vector3(-forward.z, 0, forward.x).normalize();
  }
}

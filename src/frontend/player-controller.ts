import * as THREE from "three";
import * as CANNON from "cannon-es";
import { InputManager } from "./input-manager";
import { CameraController } from "./camera-controller";
import { PhysicsManager } from "./physics-manager";
import { AnimationManager } from "./animation-manager";

export class PlayerController {
  private player_body: CANNON.Body;
  private character_model: THREE.Group;
  private physics_manager: PhysicsManager;
  private input_manager: InputManager;
  private camera_controller: CameraController;
  private animation_manager: AnimationManager;

  private movement_speed = 5;
  private jump_force = 5;
  private is_grounded = false;
  private target_rotation = 0;
  private rotation_smoothing = 0.1;

  constructor(
    player_body: CANNON.Body,
    character_model: THREE.Group,
    physics_manager: PhysicsManager,
    input_manager: InputManager,
    camera_controller: CameraController,
    animation_manager: AnimationManager
  ) {
    this.player_body = player_body;
    this.character_model = character_model;
    this.physics_manager = physics_manager;
    this.input_manager = input_manager;
    this.camera_controller = camera_controller;
    this.animation_manager = animation_manager;
  }

  update(): void {
    this.handle_jump();
    this.update_movement();
    this.update_rotation();
    this.check_grounded();
    this.update_animations();
  }

  private handle_jump(): void {
    if (this.input_manager.is_key_pressed(" ") && this.is_grounded) {
      this.player_body.applyLocalImpulse(
        new CANNON.Vec3(0, this.jump_force, 0),
        new CANNON.Vec3(0, 0, 0)
      );
    }
  }

  private update_movement(): void {
    const forward = this.camera_controller.get_forward_direction();
    const right = this.camera_controller.get_right_direction();

    let move_x = 0;
    let move_z = 0;

    if (this.input_manager.is_key_pressed("w")) move_z += 1;
    if (this.input_manager.is_key_pressed("s")) move_z -= 1;
    if (this.input_manager.is_key_pressed("a")) move_x -= 1;
    if (this.input_manager.is_key_pressed("d")) move_x += 1;

    const desired_velocity = new THREE.Vector3();
    desired_velocity.addScaledVector(right, move_x);
    desired_velocity.addScaledVector(forward, move_z);
    desired_velocity.normalize();

    const speed = desired_velocity.length() > 0 ? this.movement_speed : 0;
    desired_velocity.multiplyScalar(speed);

    const current_velocity = this.player_body.velocity;
    this.player_body.velocity.set(desired_velocity.x, current_velocity.y, desired_velocity.z);

    if (desired_velocity.length() > 0) {
      this.target_rotation = Math.atan2(desired_velocity.x, desired_velocity.z);
    }
  }

  private update_rotation(): void {
    const angle_diff = this.target_rotation - this.character_model.rotation.y;
    const shortest_angle = Math.atan2(Math.sin(angle_diff), Math.cos(angle_diff));
    this.character_model.rotation.y += shortest_angle * this.rotation_smoothing;
  }

  private check_grounded(): void {
    const ray_start = new CANNON.Vec3(
      this.player_body.position.x,
      this.player_body.position.y,
      this.player_body.position.z
    );
    const ray_end = new CANNON.Vec3(
      this.player_body.position.x,
      this.player_body.position.y - 1,
      this.player_body.position.z
    );

    const ray_result = this.physics_manager.raycast_closest(ray_start, ray_end);
    this.is_grounded = ray_result.hasHit;
  }

  private update_animations(): void {
    const velocity = this.player_body.velocity;
    const horizontal_velocity = Math.sqrt(velocity.x ** 2 + velocity.z ** 2);
    const vertical_velocity = velocity.y;

    this.animation_manager.update_state(horizontal_velocity, vertical_velocity);
  }

  sync_position(): void {
    this.character_model.position.copy(this.player_body.position as any);
  }
}

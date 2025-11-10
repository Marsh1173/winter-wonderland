import * as THREE from "three";
import * as CANNON from "cannon-es";
import { InputManager } from "./input-manager";
import { CameraController } from "./camera-controller";
import { PhysicsManager } from "./physics-manager";
import { AnimationManager } from "./animation-manager";
import { GroundChecker } from "./ground-checker";

export class PlayerController {
  private player_body: CANNON.Body;
  private character_model: THREE.Group;
  private input_manager: InputManager;
  private camera_controller: CameraController;
  private animation_manager: AnimationManager;
  private ground_checker: GroundChecker;

  private movement_speed = 5;
  private jump_speed = 8; // Velocity to give player when jumping
  private target_rotation = 0;
  private rotation_smoothing = 0.1;
  private space_was_pressed = false; // Track if space was pressed in previous frame

  constructor(
    player_body: CANNON.Body,
    character_model: THREE.Group,
    _physics_manager: PhysicsManager,
    input_manager: InputManager,
    camera_controller: CameraController,
    animation_manager: AnimationManager,
    world: CANNON.World
  ) {
    this.player_body = player_body;
    this.character_model = character_model;
    this.input_manager = input_manager;
    this.camera_controller = camera_controller;
    this.animation_manager = animation_manager;
    this.ground_checker = new GroundChecker(player_body, world);
  }

  update(): void {
    this.handle_jump();
    this.update_movement();
    this.update_rotation();
    this.update_animations();
  }

  private handle_jump(): void {
    const space_is_pressed = this.input_manager.is_key_pressed(" ");

    // Only jump if space was just pressed (transition from not pressed to pressed)
    if (space_is_pressed && !this.space_was_pressed && this.ground_checker.is_grounded()) {
      // Set Y velocity directly for reliable, consistent jumps
      this.player_body.velocity.y = this.jump_speed;
    }

    this.space_was_pressed = space_is_pressed;
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

  private update_animations(): void {
    const velocity = this.player_body.velocity;
    const horizontal_velocity = Math.sqrt(velocity.x ** 2 + velocity.z ** 2);
    const vertical_velocity = velocity.y;

    this.animation_manager.update_state(horizontal_velocity, vertical_velocity, this.ground_checker.is_grounded());
  }

  sync_position(): void {
    this.character_model.position.copy(this.player_body.position as any);
  }
}

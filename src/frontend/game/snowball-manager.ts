import * as THREE from "three";
import { PhysicsManager } from "../physics/physics-manager";

interface Snowball {
  mesh: THREE.Mesh;
  start_position: THREE.Vector3;
  direction: THREE.Vector3;
  velocity: THREE.Vector3;
  creation_time: number;
  active: boolean;
}

export class SnowballManager {
  private snowballs: Snowball[] = [];
  private scene: THREE.Scene;
  private physics_manager: PhysicsManager;
  private max_lifetime = 3; // seconds
  private speed = 13; // units per second
  private snowball_radius = 0.2; // 2/3 of original 0.3
  private collision_range = 0.5; // For player collision detection
  private collision_check_distance = 1.0; // Look-ahead distance for raycasting

  constructor(scene: THREE.Scene, physics_manager: PhysicsManager) {
    this.scene = scene;
    this.physics_manager = physics_manager;
  }

  create_snowball(position: THREE.Vector3, direction_angle: number): void {
    // Create geometry and material
    const geometry = new THREE.IcosahedronGeometry(this.snowball_radius, 3);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xf0f8ff,
      emissiveIntensity: 0.2,
      roughness: 0.8,
      metalness: 0.1,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // Calculate velocity from angle (in XZ plane)
    const direction_vector = new THREE.Vector3(Math.sin(direction_angle), 0, Math.cos(direction_angle));

    // Spawn snowball slightly forward from player to avoid immediate collision
    const spawn_offset = 0.5;
    const spawn_position = new THREE.Vector3(
      position.x + direction_vector.x * spawn_offset,
      position.y,
      position.z + direction_vector.z * spawn_offset
    );
    mesh.position.copy(spawn_position);
    this.scene.add(mesh);

    const velocity = direction_vector.clone().multiplyScalar(this.speed);

    const snowball: Snowball = {
      mesh,
      start_position: position.clone(),
      direction: direction_vector,
      velocity,
      creation_time: performance.now() / 1000,
      active: true,
    };

    this.snowballs.push(snowball);
  }

  update(dt: number, player_positions: Map<string, THREE.Vector3>): void {
    for (let i = this.snowballs.length - 1; i >= 0; i--) {
      const snowball = this.snowballs[i]!;
      if (!snowball.active) continue;

      // Update position
      snowball.mesh.position.addScaledVector(snowball.velocity, dt);

      // Check lifetime
      const elapsed = performance.now() / 1000 - snowball.creation_time;
      if (elapsed > this.max_lifetime) {
        this.remove_snowball(i);
        continue;
      }

      // Check environment collision (raycasting)
      if (this.check_environment_collision(snowball)) {
        this.remove_snowball(i);
        continue;
      }

      // Check player collision
      if (this.check_player_collision(snowball, player_positions)) {
        this.remove_snowball(i);
        continue;
      }
    }
  }

  private check_environment_collision(snowball: Snowball): boolean {
    // Cast ray forward to detect upcoming collisions
    const ray_origin = snowball.mesh.position.clone();
    const ray_direction = snowball.velocity.clone().normalize();
    // Use smaller look-ahead distance to avoid detecting future collisions too early
    const raycaster = new THREE.Raycaster(ray_origin, ray_direction, 0, this.collision_check_distance * 0.5);

    // Collect only environment meshes, not characters or effects
    const world_meshes: THREE.Object3D[] = [];
    this.scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child !== snowball.mesh) {
        // Only collide with meshes that are part of the environment
        // Skip: animation effects, characters, and other non-terrain objects
        const name = child.name.toLowerCase();
        if (
          !name.includes("character") &&
          !name.includes("remote") &&
          !name.includes("particle") &&
          !name.includes("effect") &&
          !name.includes("snowball")
        ) {
          // Only add if it's actually visible and has geometry
          if (child.visible && child.geometry) {
            world_meshes.push(child);
          }
        }
      }
    });

    if (world_meshes.length === 0) {
      return false;
    }

    const intersects = raycaster.intersectObjects(world_meshes);
    return intersects.length > 0;
  }

  private check_player_collision(snowball: Snowball, player_positions: Map<string, THREE.Vector3>): boolean {
    for (const player_pos of player_positions.values()) {
      const distance = snowball.mesh.position.distanceTo(player_pos);
      if (distance < this.collision_range) {
        return true;
      }
    }
    return false;
  }

  private remove_snowball(index: number): void {
    const snowball = this.snowballs[index]!;
    this.scene.remove(snowball.mesh);
    snowball.mesh.geometry.dispose();
    if (Array.isArray(snowball.mesh.material)) {
      snowball.mesh.material.forEach((mat) => mat.dispose());
    } else {
      snowball.mesh.material.dispose();
    }
    this.snowballs.splice(index, 1);
  }

  cleanup(): void {
    for (const snowball of this.snowballs) {
      this.scene.remove(snowball.mesh);
      snowball.mesh.geometry.dispose();
      if (Array.isArray(snowball.mesh.material)) {
        snowball.mesh.material.forEach((mat) => mat.dispose());
      } else {
        snowball.mesh.material.dispose();
      }
    }
    this.snowballs = [];
  }
}

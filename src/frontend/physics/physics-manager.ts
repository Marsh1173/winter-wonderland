import * as CANNON from "cannon-es";
import * as THREE from "three";

// Collision layer constants
export const COLLISION_LAYER = {
  PLAYER: 1,
  ENVIRONMENT: 2,
} as const;

export class PhysicsManager {
  private world: CANNON.World;
  private player_body: CANNON.Body | null = null;
  private ground_body: CANNON.Body | null = null;
  private environment_bodies: CANNON.Body[] = [];

  constructor() {
    this.world = new CANNON.World();
    this.world.gravity.set(0, -9.82, 0);
    this.world.defaultContactMaterial.friction = 0.3;
  }

  create_ground(geometry?: THREE.BufferGeometry, position_y: number = 0): void {
    let ground_shape: CANNON.Shape;

    if (geometry) {
      // Create trimesh from provided geometry (concave collision)
      const position_attr = geometry.getAttribute("position");
      if (!position_attr) {
        throw new Error("Geometry must have position attribute");
      }

      const vertices: number[] = [];
      for (let i = 0; i < position_attr.count; i++) {
        vertices.push(
          position_attr.getX(i),
          position_attr.getY(i),
          position_attr.getZ(i)
        );
      }

      const indices: number[] = [];
      if (geometry.index) {
        for (let i = 0; i < geometry.index.count; i++) {
          indices.push(geometry.index.getX(i));
        }
      } else {
        for (let i = 0; i < vertices.length / 3; i++) {
          indices.push(i);
        }
      }

      ground_shape = new CANNON.Trimesh(vertices, indices);
    } else {
      // Default simple ground plane
      ground_shape = new CANNON.Box(new CANNON.Vec3(50, 0.1, 50));
    }

    this.ground_body = new CANNON.Body({
      mass: 0,
      shape: ground_shape,
      collisionFilterGroup: COLLISION_LAYER.ENVIRONMENT,
      collisionFilterMask: COLLISION_LAYER.PLAYER,
    });
    this.ground_body.position.set(0, position_y, 0);
    this.world.addBody(this.ground_body);
  }

  create_environment_collider(geometry: THREE.BufferGeometry, position: THREE.Vector3, rotation: THREE.Euler): void {
    const position_attr = geometry.getAttribute("position");
    if (!position_attr) {
      return;
    }

    const vertices: number[] = [];
    for (let i = 0; i < position_attr.count; i++) {
      vertices.push(
        position_attr.getX(i),
        position_attr.getY(i),
        position_attr.getZ(i)
      );
    }

    const indices: number[] = [];
    if (geometry.index) {
      for (let i = 0; i < geometry.index.count; i++) {
        indices.push(geometry.index.getX(i));
      }
    } else {
      for (let i = 0; i < vertices.length / 3; i++) {
        indices.push(i);
      }
    }

    // Create trimesh (concave collision shape)
    const trimesh_shape = new CANNON.Trimesh(vertices, indices);

    const body = new CANNON.Body({
      mass: 0,
      shape: trimesh_shape,
      collisionFilterGroup: COLLISION_LAYER.ENVIRONMENT,
      collisionFilterMask: COLLISION_LAYER.PLAYER,
    });

    // Set position matching Three.js object
    body.position.set(position.x, position.y, position.z);

    // Set rotation matching Three.js object
    const quaternion = new CANNON.Quaternion();
    quaternion.setFromEuler(rotation.x, rotation.y, rotation.z);
    body.quaternion = quaternion;

    this.world.addBody(body);
    this.environment_bodies.push(body);
  }

  create_player(x: number, y: number, z: number): CANNON.Body {
    const player_shape = new CANNON.Sphere(0.5);
    this.player_body = new CANNON.Body({
      mass: 1,
      shape: player_shape,
      linearDamping: 0.9,
      angularDamping: 0.9,
      collisionFilterGroup: COLLISION_LAYER.PLAYER,
      collisionFilterMask: COLLISION_LAYER.ENVIRONMENT,
    });
    this.player_body.position.set(x, y, z);
    // Prevent rotation on X and Z axes (no rolling), allow Y-axis rotation for turning
    this.player_body.angularFactor = new CANNON.Vec3(0, 1, 0);
    this.world.addBody(this.player_body);
    return this.player_body;
  }

  get_player_body(): CANNON.Body | null {
    return this.player_body;
  }

  get_world(): CANNON.World {
    return this.world;
  }

  step(dt: number): void {
    this.world.step(1 / 60, dt, 3);
  }
}

import * as CANNON from "cannon-es";

// Collision layer constants
export const COLLISION_LAYER = {
  PLAYER: 1,
  ENVIRONMENT: 2,
} as const;

export class PhysicsManager {
  private world: CANNON.World;
  private player_body: CANNON.Body | null = null;
  private ground_body: CANNON.Body | null = null;

  constructor() {
    this.world = new CANNON.World();
    this.world.gravity.set(0, -9.82, 0);
    this.world.defaultContactMaterial.friction = 0.3;
  }

  create_ground(): void {
    const ground_shape = new CANNON.Box(new CANNON.Vec3(50, 0.1, 50));
    this.ground_body = new CANNON.Body({
      mass: 0,
      shape: ground_shape,
      collisionFilterGroup: COLLISION_LAYER.ENVIRONMENT,
      collisionFilterMask: COLLISION_LAYER.PLAYER,
    });
    this.ground_body.position.set(0, -0.1, 0);
    this.world.addBody(this.ground_body);
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

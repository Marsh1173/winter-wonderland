import * as CANNON from "cannon-es";

/**
 * Robust ground detection using Cannon-ES collision events.
 * Features:
 * - Checks if contact normals point upward (configurable threshold)
 * - Grace period to prevent rapid flickering on varied terrain
 */
export class GroundChecker {
  private player_body: CANNON.Body;
  private world: CANNON.World;
  private ground_contacts: number = 0;
  private ground_normal_threshold: number = 0.3; // Lower = accept steeper slopes (0.3 ≈ 72° max)
  private ground_contact_pairs: Set<string> = new Set();

  // Grace period: Stay "grounded" briefly after losing contact to reduce flicker
  private last_grounded_time: number = 0;
  private grace_period_ms: number = 100; // 100ms grace period

  constructor(player_body: CANNON.Body, world: CANNON.World) {
    this.player_body = player_body;
    this.world = world;
    this.setup_listeners();
  }

  private create_contact_id(bodyA: CANNON.Body, bodyB: CANNON.Body): string {
    return `${bodyA.id}-${bodyB.id}`;
  }

  public is_grounded(): boolean {
    const has_contacts = this.ground_contacts > 0;

    // Update last grounded time if we have contacts
    if (has_contacts) {
      this.last_grounded_time = Date.now();
    }

    // Check if we're within grace period
    const time_since_grounded = Date.now() - this.last_grounded_time;
    const in_grace_period = time_since_grounded < this.grace_period_ms;

    const is_grounded = has_contacts || in_grace_period;

    return is_grounded;
  }

  public is_falling(): boolean {
    return !this.is_grounded() && this.player_body.velocity.y < 0;
  }

  private setup_listeners(): void {
    this.world.addEventListener("beginContact", (event: any) => {
      this.handle_contact_start(event);
    });

    this.world.addEventListener("endContact", (event: any) => {
      this.handle_contact_end(event);
    });
  }

  private handle_contact_start(event: any): void {
    const { bodyA, bodyB, target } = event;

    if (bodyA !== this.player_body && bodyB !== this.player_body) {
      return;
    }

    let contact = target;
    if (!contact || !contact.ni) {
      contact = this.world.contacts.find(
        (c) => (c.bi === bodyA && c.bj === bodyB) || (c.bi === bodyB && c.bj === bodyA)
      );
    }

    if (!contact) {
      return;
    }

    let contact_normal = contact.ni.clone();

    if (contact_normal.y < 0) {
      contact_normal = new CANNON.Vec3(-contact_normal.x, -contact_normal.y, -contact_normal.z);
    }

    if (contact_normal.y > this.ground_normal_threshold) {
      this.ground_contacts++;
      const contact_id = this.create_contact_id(bodyA, bodyB);
      this.ground_contact_pairs.add(contact_id);
    }
  }

  private handle_contact_end(event: any): void {
    const { bodyA, bodyB } = event;

    if (bodyA !== this.player_body && bodyB !== this.player_body) {
      return;
    }

    const contact_id = this.create_contact_id(bodyA, bodyB);

    if (this.ground_contact_pairs.has(contact_id)) {
      this.ground_contact_pairs.delete(contact_id);
      this.ground_contacts = Math.max(0, this.ground_contacts - 1);
    }
  }

  public set_ground_threshold(threshold: number): void {
    this.ground_normal_threshold = threshold;
  }

  public set_grace_period(ms: number): void {
    this.grace_period_ms = ms;
  }
}

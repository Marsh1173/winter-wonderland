import * as CANNON from "cannon-es";

/**
 * Robust ground detection using Cannon-ES collision events.
 * Instead of raycasting, we listen to collision events and check if contact normals point upward.
 * This handles slopes, multiple surfaces, and moving platforms automatically.
 */
export class GroundChecker {
  private player_body: CANNON.Body;
  private world: CANNON.World;
  private ground_contacts: number = 0;
  private ground_normal_threshold: number = 0.5; // Surfaces pointing up more than this count as ground
  private ground_contact_pairs: Set<string> = new Set(); // Track which contact pairs are ground

  constructor(player_body: CANNON.Body, world: CANNON.World) {
    this.player_body = player_body;
    this.world = world;
    this.setup_listeners();
  }

  /**
   * Create a stable identifier for a contact pair
   */
  private create_contact_id(bodyA: CANNON.Body, bodyB: CANNON.Body): string {
    return `${bodyA.id}-${bodyB.id}`;
  }

  /**
   * Returns true if player is currently touching ground
   */
  public is_grounded(): boolean {
    return this.ground_contacts > 0;
  }

  /**
   * Returns true if player is in the air and moving downward
   */
  public is_falling(): boolean {
    return !this.is_grounded() && this.player_body.velocity.y < 0;
  }

  /**
   * Set up collision event listeners on the physics world
   */
  private setup_listeners(): void {
    this.world.addEventListener("beginContact", (event: any) => {
      this.handle_contact_start(event);
    });

    this.world.addEventListener("endContact", (event: any) => {
      this.handle_contact_end(event);
    });
  }

  /**
   * Called when a collision contact begins
   * Checks if it's with the player and if the surface points upward
   */
  private handle_contact_start(event: any): void {
    const { bodyA, bodyB, target } = event;

    // Check if this contact involves the player body
    if (bodyA !== this.player_body && bodyB !== this.player_body) {
      return;
    }

    // Try to get contact from event.target first, then search world.contacts
    let contact = target;
    if (!contact || !contact.ni) {
      contact = this.world.contacts.find(c =>
        (c.bi === bodyA && c.bj === bodyB) || (c.bi === bodyB && c.bj === bodyA)
      );
    }

    if (!contact) {
      return;
    }

    // Get the normal - it points from bi to bj
    let contact_normal = contact.ni.clone();

    // Ensure normal points away from ground (upward for horizontal surfaces)
    // If it's pointing downward, flip it
    if (contact_normal.y < 0) {
      contact_normal = new CANNON.Vec3(-contact_normal.x, -contact_normal.y, -contact_normal.z);
    }

    // Consider it "ground" if the surface normal points mostly upward
    if (contact_normal.y > this.ground_normal_threshold) {
      this.ground_contacts++;
      const contact_id = this.create_contact_id(bodyA, bodyB);
      this.ground_contact_pairs.add(contact_id);
    }
  }

  /**
   * Called when a collision contact ends
   * Decrements ground contact count if it was a ground surface
   */
  private handle_contact_end(event: any): void {
    const { bodyA, bodyB } = event;

    // Check if this contact involves the player body
    if (bodyA !== this.player_body && bodyB !== this.player_body) {
      return;
    }

    const contact_id = this.create_contact_id(bodyA, bodyB);

    // Only decrement if this was a contact we counted as ground
    if (this.ground_contact_pairs.has(contact_id)) {
      this.ground_contact_pairs.delete(contact_id);
      this.ground_contacts = Math.max(0, this.ground_contacts - 1);
    }
  }

  /**
   * Set the threshold for what counts as "ground"
   * Higher = stricter (only flat surfaces)
   * Lower = allows steeper slopes
   * Default: 0.5 (allows ~60° slopes)
   */
  public set_ground_threshold(threshold: number): void {
    this.ground_normal_threshold = threshold;
  }
}

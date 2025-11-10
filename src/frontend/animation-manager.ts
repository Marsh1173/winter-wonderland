import * as THREE from "three";

type AnimationState = "idle" | "walk" | "jump" | "fall";

export class AnimationManager {
  private mixer: THREE.AnimationMixer;
  private animations_map: Map<string, THREE.AnimationClip> = new Map();
  private actions_cache: Map<string, THREE.AnimationAction> = new Map();
  private current_action: THREE.AnimationAction | null = null;
  private current_state: AnimationState = "idle";
  private transition_duration = 0.1;
  private was_grounded = true;

  constructor(mixer: THREE.AnimationMixer, clips: THREE.AnimationClip[]) {
    this.mixer = mixer;
    this.index_animations(clips);
    this.cache_actions();
  }

  private index_animations(clips: THREE.AnimationClip[]): void {
    for (const clip of clips) {
      this.animations_map.set(clip.name.toLowerCase(), clip);
    }
  }

  private cache_actions(): void {
    // Pre-create all animation actions upfront to avoid THREE.js reuse issues
    for (const [name, clip] of this.animations_map) {
      const action = this.mixer.clipAction(clip);
      this.actions_cache.set(name, action);
    }
  }

  private find_action(names: string[]): THREE.AnimationAction | null {
    for (const name of names) {
      const action = this.actions_cache.get(name.toLowerCase());
      if (action) return action;
    }
    return null;
  }

  private play_animation(names: string[], loop: boolean = true): void {
    const next_action = this.find_action(names);
    if (!next_action) return;

    // Configure the action
    next_action.loop = loop ? THREE.LoopRepeat : THREE.LoopOnce;
    next_action.clampWhenFinished = !loop; // Keep final pose for non-looping animations
    next_action.reset(); // Clear any previous state

    // Smooth transition from current action to next
    if (this.current_action && this.current_action !== next_action) {
      this.current_action.crossFadeTo(next_action, this.transition_duration, true);
    }

    next_action.play();
    this.current_action = next_action;
  }

  play_idle(): void {
    if (this.current_state === "idle") return;
    this.current_state = "idle";
    this.play_animation(["stand", "idle"]);
  }

  play_walk(): void {
    if (this.current_state === "walk") return;
    this.current_state = "walk";
    this.play_animation(["walk", "run"]);
  }

  play_jump(): void {
    if (this.current_state === "jump") return;
    this.current_state = "jump";
    this.play_animation(["jump", "falling"], false);
  }

  play_fall(): void {
    if (this.current_state === "fall") return;
    this.current_state = "fall";
    this.play_animation(["fall", "falling"], true);
  }

  update_state(horizontal_velocity: number, vertical_velocity: number, is_grounded: boolean): void {
    const idle_threshold = 0.5;
    const falling_threshold = -0.5;

    // Diagnostic logging (1% sample rate to avoid spam)
    if (Math.random() < 0.01) {
      console.log('[Animation State]', {
        current_state: this.current_state,
        is_grounded,
        horizontal_velocity: horizontal_velocity.toFixed(2),
        vertical_velocity: vertical_velocity.toFixed(2),
        was_grounded: this.was_grounded,
        falling: vertical_velocity < falling_threshold,
      });
    }

    // Only trigger jump animation when transitioning from grounded to airborne
    if (this.was_grounded && !is_grounded) {
      this.play_jump();
    } else if (!is_grounded) {
      // Airborne - transition to fall if falling fast enough
      if (vertical_velocity < falling_threshold) {
        this.play_fall();
      }
      // Otherwise keep playing jump animation
    } else if (is_grounded) {
      // While grounded, switch between walk and idle based on movement
      if (Math.abs(horizontal_velocity) > idle_threshold) {
        this.play_walk();
      } else {
        this.play_idle();
      }
    }

    this.was_grounded = is_grounded;
  }
}

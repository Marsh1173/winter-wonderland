import * as THREE from "three";

type AnimationState = "idle" | "walk" | "jump";

export class AnimationManager {
  private mixer: THREE.AnimationMixer;
  private animations_map: Map<string, THREE.AnimationClip> = new Map();
  private current_action: THREE.AnimationAction | null = null;
  private current_state: AnimationState = "idle";

  constructor(mixer: THREE.AnimationMixer, clips: THREE.AnimationClip[]) {
    this.mixer = mixer;
    this.index_animations(clips);
  }

  private index_animations(clips: THREE.AnimationClip[]): void {
    for (const clip of clips) {
      this.animations_map.set(clip.name.toLowerCase(), clip);
    }
  }

  private find_animation(names: string[]): THREE.AnimationClip | null {
    for (const name of names) {
      const clip = this.animations_map.get(name.toLowerCase());
      if (clip) return clip;
    }
    return null;
  }

  private play_animation(names: string[], loop: boolean = true): void {
    const clip = this.find_animation(names);
    if (!clip) return;

    if (this.current_action) {
      this.current_action.fadeOut(0.2);
    }

    const action = this.mixer.clipAction(clip);
    action.loop = loop ? THREE.LoopRepeat : THREE.LoopOnce;
    action.fadeIn(0.2);
    action.play();

    this.current_action = action;
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

  update_state(
    horizontal_velocity: number,
    vertical_velocity: number
  ): void {
    const idle_threshold = 0.5;
    const air_threshold = 0.1;

    if (Math.abs(vertical_velocity) > air_threshold) {
      this.play_jump();
    } else if (Math.abs(horizontal_velocity) > idle_threshold) {
      this.play_walk();
    } else {
      this.play_idle();
    }
  }
}

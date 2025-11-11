import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { get_character_model_url } from "@/model/characters";
import { SnowballEffect } from "./snowball-effect";
import { AnimationManager } from "../animation/animation-manager";
import type { Vec3 } from "@/model/multiplayer-types";

interface RemotePlayer {
  player_id: string;
  name: string;
  character_id: string;
  model: THREE.Group;
  position: Vec3;
  rotation: number;
  target_position: Vec3;
  target_rotation: number;
  current_velocity: Vec3;
  last_action: string | null;
  last_update_time: number;
  mixer: THREE.AnimationMixer | null;
  animation_clips: THREE.AnimationClip[];
  animation_manager: AnimationManager | null;
}

export class RemotePlayerManager {
  private remote_players: Map<string, RemotePlayer> = new Map();
  private scene: THREE.Scene;
  private loader: GLTFLoader;
  private snowball_effect: SnowballEffect;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.loader = new GLTFLoader();
    this.snowball_effect = new SnowballEffect(scene);
  }

  async add_player(
    player_id: string,
    name: string,
    character_id: string,
    position: Vec3,
    rotation: number
  ): Promise<void> {
    // Don't add if already exists
    if (this.remote_players.has(player_id)) {
      console.log(`⚠️  Remote player ${name} already exists, skipping`);
      return;
    }

    try {
      const model_path = get_character_model_url(character_id);
      const gltf = await this.load_model(model_path);

      const model = gltf.scene;
      model.scale.set(1, 1, 1);
      model.position.set(position.x, position.y, position.z);
      model.rotation.y = rotation;

      model.traverse((node) => {
        if (node instanceof THREE.Mesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });

      this.scene.add(model);

      // Setup animations
      const animation_clips = gltf.animations || [];
      let mixer: THREE.AnimationMixer | null = null;
      let animation_manager: AnimationManager | null = null;

      if (animation_clips.length > 0) {
        mixer = new THREE.AnimationMixer(model);
        animation_manager = new AnimationManager(mixer, animation_clips);
        animation_manager.play_idle();
      }

      const remote_player: RemotePlayer = {
        player_id,
        name,
        character_id,
        model,
        position: { ...position },
        rotation,
        target_position: { ...position },
        target_rotation: rotation,
        current_velocity: { x: 0, y: 0, z: 0 },
        last_action: null,
        last_update_time: Date.now(),
        mixer,
        animation_clips,
        animation_manager,
      };

      this.remote_players.set(player_id, remote_player);
    } catch (error) {
      console.error(`❌ Failed to load remote player model for ${character_id}:`, error);
    }
  }

  remove_player(player_id: string): void {
    const remote_player = this.remote_players.get(player_id);
    if (!remote_player) {
      return;
    }

    this.scene.remove(remote_player.model);

    // Cleanup animations
    if (remote_player.mixer) {
      remote_player.mixer.stopAllAction();
    }

    this.remote_players.delete(player_id);
  }

  update_player(player_id: string, position: Vec3, rotation: number, velocity: Vec3, action?: string): void {
    const remote_player = this.remote_players.get(player_id);
    if (!remote_player) {
      return;
    }

    remote_player.target_position = { ...position };
    remote_player.target_rotation = rotation;
    remote_player.current_velocity = { ...velocity };
    if (action) {
      remote_player.last_action = action;
    }
    remote_player.last_update_time = Date.now();
  }

  handle_action(
    player_id: string,
    action: string,
    position: Vec3,
    velocity: Vec3,
    direction?: number,
    rotation?: number
  ): void {
    const remote_player = this.remote_players.get(player_id);
    if (!remote_player) {
      return;
    }

    // Update position with action and velocity info
    this.update_player(player_id, position, rotation ?? remote_player.target_rotation, velocity, action);

    // Handle specific actions
    if (action === "throw" && direction) {
      this.play_throw_animation(remote_player);
      this.show_snowball_effect(position, direction);
    }
  }

  update(delta_time: number): void {
    const interpolation_speed = 0.15; // Controls how quickly players interpolate to target position

    for (const remote_player of this.remote_players.values()) {
      // Interpolate position
      remote_player.position.x += (remote_player.target_position.x - remote_player.position.x) * interpolation_speed;
      remote_player.position.y += (remote_player.target_position.y - remote_player.position.y) * interpolation_speed;
      remote_player.position.z += (remote_player.target_position.z - remote_player.position.z) * interpolation_speed;

      // For moving players, also extrapolate based on velocity to predict future position
      if (remote_player.last_action === "move" && delta_time > 0) {
        remote_player.position.x += remote_player.current_velocity.x * delta_time * 0.5;
        remote_player.position.z += remote_player.current_velocity.z * delta_time * 0.5;
      }

      // Calculate horizontal velocity to determine rotation speed
      const horizontal_velocity = Math.sqrt(
        remote_player.current_velocity.x ** 2 + remote_player.current_velocity.z ** 2
      );

      // Use faster rotation when moving, slower when idle
      // const rotation_speed = horizontal_velocity > 0.5 ? 0.25 : 0.1;
      const rotation_speed = 0.5;

      // Interpolate rotation using shortest angle
      const angle_diff = remote_player.target_rotation - remote_player.rotation;
      const shortest_angle = Math.atan2(Math.sin(angle_diff), Math.cos(angle_diff));
      remote_player.rotation += shortest_angle * rotation_speed;

      // Update animations based on movement state
      if (remote_player.animation_manager) {
        // Calculate horizontal velocity magnitude
        const horizontal_velocity = Math.sqrt(
          remote_player.current_velocity.x ** 2 + remote_player.current_velocity.z ** 2
        );
        const vertical_velocity = remote_player.current_velocity.y;

        // Determine if grounded (not falling significantly)
        const is_grounded = vertical_velocity > -2;

        // Update animation state
        remote_player.animation_manager.update_state(horizontal_velocity, vertical_velocity, is_grounded);
      }

      // Update animation mixer
      if (remote_player.mixer) {
        remote_player.mixer.update(delta_time);
      }

      // Update the Three.js model
      remote_player.model.position.set(remote_player.position.x, remote_player.position.y, remote_player.position.z);
      remote_player.model.rotation.y = remote_player.rotation;
    }
  }

  private play_throw_animation(remote_player: RemotePlayer): void {
    // TODO: Implement throw animation if available
    // For now, this is a placeholder for future animation support
  }

  private show_snowball_effect(position: Vec3, direction: number): void {
    this.snowball_effect.show_throw_effect(position, direction);
  }

  private load_model(path: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.loader.load(path, resolve, undefined, reject);
    });
  }

  get_player(player_id: string): RemotePlayer | undefined {
    return this.remote_players.get(player_id);
  }

  get_all_players(): RemotePlayer[] {
    return Array.from(this.remote_players.values());
  }

  get_player_count(): number {
    return this.remote_players.size;
  }

  cleanup(): void {
    for (const [player_id] of this.remote_players) {
      this.remove_player(player_id);
    }
  }
}

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { get_character_model_url } from "@/model/characters";
import { PhysicsManager } from "../physics/physics-manager";
import { InputManager } from "../managers/input-manager";
import { CameraController } from "../managers/camera-controller";
import { PlayerController } from "./player-controller";
import { AnimationManager } from "../animation/animation-manager";
import { RemotePlayerManager } from "./remote-player-manager";
import { SnowballEffect } from "./snowball-effect";
import type { PlayerActionMessage, ServerMessage, Vec3, WorldSnapshotMessage } from "@/model/multiplayer-types";

export class GameScene {
  private character_id: string;

  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private loader: GLTFLoader;
  private clock: THREE.Clock;
  private animation_id: number | null = null;

  private character_model: THREE.Group | null = null;
  private mixer: THREE.AnimationMixer | null = null;
  private animation_clips: THREE.AnimationClip[] = [];

  private physics_manager: PhysicsManager;
  private input_manager: InputManager;
  private camera_controller: CameraController;
  private player_controller: PlayerController | null = null;
  private remote_player_manager: RemotePlayerManager;
  private snowball_effect: SnowballEffect;

  private ws: WebSocket | null = null;
  private on_message_handler: ((event: MessageEvent) => void) | null = null;

  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private ground_plane: THREE.Plane;
  private throw_target: THREE.Vector3;
  private on_click_handler: ((event: MouseEvent) => void) | null = null;

  constructor(private canvas: HTMLCanvasElement, world_snapshot: WorldSnapshotMessage, ws: WebSocket) {
    this.character_id = world_snapshot.character_id;
    this.loader = new GLTFLoader();
    this.clock = new THREE.Clock();

    // Initialize WebSocket listener immediately if provided
    if (ws) {
      this.init_websocket(ws);
    }

    this.renderer = this.setup_renderer();
    this.scene = new THREE.Scene();
    this.camera = this.setup_camera();

    this.physics_manager = new PhysicsManager();
    this.input_manager = new InputManager();
    this.camera_controller = new CameraController(this.camera);
    this.remote_player_manager = new RemotePlayerManager(this.scene);
    this.snowball_effect = new SnowballEffect(this.scene);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.ground_plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.throw_target = new THREE.Vector3();

    this.setup_lights();
    this.setup_floor();
    this.input_manager.init();

    window.addEventListener("resize", () => this.on_window_resize());
    this.on_click_handler = (event: MouseEvent) => this.handle_mouse_click(event);
    window.addEventListener("click", this.on_click_handler);

    world_snapshot.players.forEach((player) => {
      this.remote_player_manager.add_player(
        player.player_id,
        player.name,
        player.character_id,
        player.position,
        player.rotation
      );
    });
  }

  init_websocket(ws: WebSocket): void {
    this.ws = ws;
    this.on_message_handler = (event: MessageEvent) => this.handle_websocket_message(event);
    this.ws.addEventListener("message", this.on_message_handler);
  }

  private setup_renderer(): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x1f2a44);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    return renderer;
  }

  private setup_camera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 3);
    camera.lookAt(0, 0.5, 0);
    return camera;
  }

  private setup_lights(): void {
    const ambient = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(ambient);

    const directional = new THREE.DirectionalLight(0xfff5a8, 1); // White-yellow
    directional.position.set(20, 16, 6);
    directional.intensity = 1.6;
    directional.castShadow = true;
    directional.shadow.mapSize.width = 4096;
    directional.shadow.mapSize.height = 4096;
    // Configure shadow camera to cover the entire environment
    directional.shadow.camera.left = -100;
    directional.shadow.camera.right = 150;
    directional.shadow.camera.top = 100;
    directional.shadow.camera.bottom = -100;
    directional.shadow.camera.near = 0.1;
    directional.shadow.camera.far = 200;
    // Reduce bias to prevent artifacts on angled surfaces
    directional.shadow.bias = -0.0005;
    directional.shadow.normalBias = 0.02;
    this.scene.add(directional);

    const backlight = new THREE.DirectionalLight(0x5776ff, 0.5);
    backlight.position.set(-10, 5, 3);
    this.scene.add(backlight);
  }

  private setup_floor(): void {
    // Environment is loaded via load_world_environment()
    // No default ground plane needed
  }

  async load_world_environment(): Promise<void> {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      loader.load(
        "/assets/Wonderland.glb",
        (gltf) => {
          const wonderland = gltf.scene;
          // wonderland.position.y = -1;

          // Enable shadows on all meshes
          wonderland.traverse((node) => {
            if (node instanceof THREE.Mesh) {
              node.castShadow = true;
              node.receiveShadow = true;
            }
          });

          this.scene.add(wonderland);

          // Update world matrices before reading transformations
          wonderland.updateMatrixWorld(true);

          // Create separate physics colliders for each mesh (concave trimesh)
          wonderland.traverse((node) => {
            if (node instanceof THREE.Mesh) {
              const geom = node.geometry.clone();

              // Ensure geometry has position attribute
              if (!geom.hasAttribute("position")) {
                return;
              }

              // Apply world transformation matrix (includes position, rotation, AND scale)
              const world_matrix = new THREE.Matrix4();
              world_matrix.copy(node.matrixWorld);

              // Debug: Log scale information to verify Blender scales are being applied
              const scale = new THREE.Vector3();
              node.matrixWorld.decompose(new THREE.Vector3(), new THREE.Quaternion(), scale);

              geom.applyMatrix4(world_matrix);

              // Normalize geometry to only have position attribute for collision
              const position_attr = geom.getAttribute("position");
              const normalized_geom = new THREE.BufferGeometry();
              normalized_geom.setAttribute("position", position_attr);

              // Copy or create indices
              if (geom.index) {
                normalized_geom.setIndex(geom.index.clone());
              } else {
                const indices = new Uint32Array(position_attr.count);
                for (let i = 0; i < position_attr.count; i++) {
                  indices[i] = i;
                }
                normalized_geom.setIndex(new THREE.BufferAttribute(indices, 1));
              }

              // Collision body at origin (geometry already transformed to world space)
              this.physics_manager.create_environment_collider(
                normalized_geom,
                new THREE.Vector3(0, 0, 0),
                new THREE.Euler(0, 0, 0)
              );
            }
          });

          resolve();
        },
        undefined,
        (error) => {
          console.error("Failed to load Wonderland.glb:", error);
          reject(error);
        }
      );
    });
  }

  async load_character(): Promise<void> {
    // needs to be in pre-game loader
    return new Promise((resolve, reject) => {
      const model_path = get_character_model_url(this.character_id);

      this.loader.load(
        model_path,
        (gltf) => {
          this.character_model = gltf.scene;
          this.character_model.scale.set(1, 1, 1);
          this.character_model.position.set(0, 0.5, 0);

          this.character_model.traverse((node) => {
            if (node instanceof THREE.Mesh) {
              node.castShadow = true;
              node.receiveShadow = true;
            }
          });

          this.animation_clips = gltf.animations;
          this.mixer = new THREE.AnimationMixer(this.character_model);

          this.scene.add(this.character_model);
          this.setup_player_controller(this.mixer, this.character_model);
          resolve();
        },
        () => {},
        (error) => reject(error)
      );
    });
  }

  private setup_player_controller(mixer: THREE.AnimationMixer, character_model: THREE.Group): void {
    const player_body = this.physics_manager.create_player(0, 1, 0);

    const animation_manager = new AnimationManager(mixer, this.animation_clips);

    // animation_manager.play_idle(); // Do we need this

    this.player_controller = new PlayerController(
      player_body,
      character_model,
      this.physics_manager,
      this.input_manager,
      this.camera_controller,
      animation_manager,
      this.physics_manager.get_world(),
      (action, position, rotation, velocity, direction) =>
        this.send_player_action(action, position, rotation, velocity, direction)
    );
  }

  private send_player_action(
    action: "move" | "jump" | "throw",
    position: any,
    rotation: number,
    velocity: Vec3,
    direction?: number
  ): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const action_message: PlayerActionMessage = {
      type: "player_action",
      action,
      position: { x: position.x, y: position.y, z: position.z },
      rotation,
      velocity,
      direction,
    };

    this.ws.send(JSON.stringify(action_message));
  }

  start(): void {
    this.animate();
  }

  private animate = (): void => {
    this.animation_id = requestAnimationFrame(this.animate);

    const dt = this.clock.getDelta();

    this.physics_manager.step(dt);

    if (this.player_controller) {
      this.player_controller.update();
      this.player_controller.sync_position();
    }

    const player_body = this.physics_manager.get_player_body();
    if (player_body) {
      this.camera_controller.update(player_body);
    }
    if (this.mixer) {
      this.mixer.update(dt);
    }

    // Update remote players with smooth interpolation
    this.remote_player_manager.update(dt);

    this.renderer.render(this.scene, this.camera);
  };

  stop(): void {
    if (this.animation_id !== null) {
      cancelAnimationFrame(this.animation_id);
      this.animation_id = null;
    }
  }

  private on_window_resize = (): void => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private handle_mouse_click = (event: MouseEvent): void => {
    if (!this.character_model || !this.player_controller) {
      return;
    }

    // Convert mouse position to normalized device coordinates
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update raycaster with camera and mouse position
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Find intersection with ground plane
    this.raycaster.ray.intersectPlane(this.ground_plane, this.throw_target);

    // Calculate direction from player to target
    // const direction = this.throw_target.clone().sub(this.character_model.position).normalize();
    const direction = 0;

    // Show snowball effect locally
    this.snowball_effect.show_throw_effect(this.character_model.position, direction);

    // Trigger throw action
    this.player_controller.throw_snowball(direction);
  };

  private handle_websocket_message(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as ServerMessage;

      switch (message.type) {
        case "world_snapshot":
          for (const player of message.players) {
            this.remote_player_manager.add_player(
              player.player_id,
              player.name,
              player.character_id,
              player.position,
              player.rotation
            );
          }
          break;

        case "player_joined":
          this.remote_player_manager.add_player(
            message.player_id,
            message.name,
            message.character_id,
            message.position,
            message.rotation
          );
          break;

        case "player_left":
          this.remote_player_manager.remove_player(message.player_id);
          break;

        case "player_state":
          if (message.action === "throw") {
            this.remote_player_manager.handle_action(
              message.player_id,
              message.action,
              message.position,
              message.velocity,
              message.direction,
              message.rotation
            );
          } else {
            this.remote_player_manager.update_player(
              message.player_id,
              message.position,
              message.rotation,
              message.velocity,
              message.action
            );
          }
          break;
      }
    } catch (error) {
      console.error("Failed to handle WebSocket message:", error);
    }
  }

  dispose(): void {
    this.stop();
    window.removeEventListener("resize", this.on_window_resize);

    if (this.on_click_handler) {
      window.removeEventListener("click", this.on_click_handler);
    }

    if (this.ws && this.on_message_handler) {
      this.ws.removeEventListener("message", this.on_message_handler);
    }

    this.snowball_effect.cleanup();
    this.remote_player_manager.cleanup();
    this.input_manager.dispose();
    this.renderer.dispose();
  }
}

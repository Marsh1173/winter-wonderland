import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { get_character_model_url } from "@/model/characters";
import { PhysicsManager } from "./physics-manager";
import { InputManager } from "./input-manager";
import { CameraController } from "./camera-controller";
import { PlayerController } from "./player-controller";
import { AnimationManager } from "./animation-manager";

export class GameScene {
  private canvas: HTMLCanvasElement;
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

  // Managers
  private physics_manager: PhysicsManager;
  private input_manager: InputManager;
  private camera_controller: CameraController;
  private player_controller: PlayerController | null = null;

  constructor(canvas: HTMLCanvasElement, character_id: string) {
    this.canvas = canvas;
    this.character_id = character_id;
    this.loader = new GLTFLoader();
    this.clock = new THREE.Clock();

    this.renderer = this.setup_renderer();
    this.scene = new THREE.Scene();
    this.camera = this.setup_camera();

    this.physics_manager = new PhysicsManager();
    this.input_manager = new InputManager(canvas);
    this.camera_controller = new CameraController(this.camera);

    this.setup_lights();
    this.setup_floor();
    this.input_manager.init();

    window.addEventListener("resize", () => this.on_window_resize());
  }

  private setup_renderer(): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x191922);
    renderer.setPixelRatio(window.devicePixelRatio);
    return renderer;
  }

  private setup_camera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 2, 3);
    camera.lookAt(0, 0.5, 0);
    return camera;
  }

  private setup_lights(): void {
    // Ambient light
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    // Directional light (sun)
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(5, 10, 5);
    directional.castShadow = true;
    directional.shadow.mapSize.width = 2048;
    directional.shadow.mapSize.height = 2048;
    this.scene.add(directional);
  }

  private setup_floor(): void {
    const floor_geometry = new THREE.PlaneGeometry(20, 20);
    const floor_material = new THREE.MeshStandardMaterial({
      color: 0x404050,
      roughness: 0.8,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floor_geometry, floor_material);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.scene.add(floor);

    this.physics_manager.create_ground();
  }

  async load_character(): Promise<void> {
    return new Promise((resolve, reject) => {
      const model_path = get_character_model_url(this.character_id);

      this.loader.load(
        model_path,
        (gltf) => {
          this.character_model = gltf.scene;
          this.character_model.scale.set(1, 1, 1);
          this.character_model.position.set(0, 1, 0);

          this.character_model.traverse((node) => {
            if (node instanceof THREE.Mesh) {
              node.castShadow = true;
              node.receiveShadow = true;
            }
          });

          if (gltf.animations.length > 0) {
            this.animation_clips = gltf.animations;
            this.mixer = new THREE.AnimationMixer(this.character_model);
            const stand_action = this.find_stand_animation(gltf.animations);
            if (stand_action) {
              stand_action.play();
            }
          }

          this.scene.add(this.character_model);
          this.setup_player_controller();
          resolve();
        },
        () => {},
        (error) => reject(error)
      );
    });
  }

  private setup_player_controller(): void {
    const player_body = this.physics_manager.create_player(0, 1, 0);

    const animation_manager =
      this.mixer && this.character_model
        ? new AnimationManager(this.mixer, this.animation_clips)
        : null;

    if (animation_manager) {
      animation_manager.play_idle();
    }

    this.player_controller = new PlayerController(
      player_body,
      this.character_model!,
      this.physics_manager,
      this.input_manager,
      this.camera_controller,
      animation_manager!
    );
  }

  start(): void {
    console.log("Starting game scene render loop");
    this.animate();
  }

  private find_stand_animation(animations: THREE.AnimationClip[]): THREE.AnimationAction | null {
    // Look for stand, idle, or default animations
    const animation_names = ["Stand", "Idle", "idle", "stand"];

    for (const name of animation_names) {
      const clip = THREE.AnimationClip.findByName(animations, name);
      if (clip && this.mixer) {
        return this.mixer.clipAction(clip);
      }
    }

    // If no specific animation found, use the first one
    if (animations.length > 0 && this.mixer) {
      return this.mixer.clipAction(animations[0]);
    }

    return null;
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
      this.camera_controller.update(player_body, this.input_manager.get_mouse_delta());
      this.input_manager.reset_mouse_delta();
    }

    if (this.mixer) {
      this.mixer.update(dt);
    }

    this.renderer.render(this.scene, this.camera);
  };

  stop(): void {
    if (this.animation_id !== null) {
      cancelAnimationFrame(this.animation_id);
      this.animation_id = null;
    }
    console.log("Stopped game scene render loop");
  }

  private on_window_resize = (): void => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  dispose(): void {
    this.stop();
    window.removeEventListener("resize", this.on_window_resize);
    this.input_manager.dispose();
    this.renderer.dispose();
  }
}

import type { IRenderer } from "../renderer";
import { Node } from "old-src-2/model/node.n";
import { Node3D } from "old-src-2/model/node3d.n";
import type { Vector3D } from "old-src-2/model/types/vector3d";
import * as THREE from "three";

/**
 * Three.js based renderer for 3D graphics
 * Converts the scene tree into Three.js objects for rendering
 */
export class ThreeJSRenderer implements IRenderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private mesh_cache = new Map<Node, THREE.Object3D>();

  constructor(private canvas: HTMLCanvasElement) {
    // Initialize Three.js scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x222222);

    // Initialize camera
    // const width = 1920;
    // const height = 1080;
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 5);
    this.camera.lookAt(0, 0, 0);

    // Initialize renderer
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // Handle window resize
    window.addEventListener("resize", () => this.onWindowResize());
  }

  private onWindowResize(): void {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public render(root_node: Node): void {
    // Update scene based on node tree
    this.updateScene(root_node);

    // Render
    this.renderer.render(this.scene, this.camera);
  }

  private updateScene(node: Node, parentThreeObject?: THREE.Object3D): void {
    let threeObject = this.mesh_cache.get(node);

    // Create or update Three.js object for this node
    if (!threeObject) {
      threeObject = this.createThreeObject(node);
      if (threeObject) {
        this.mesh_cache.set(node, threeObject);
      }
    }

    // Add to parent or scene
    if (threeObject) {
      if (parentThreeObject) {
        if (!parentThreeObject.children.includes(threeObject)) {
          parentThreeObject.add(threeObject);
        }
      } else {
        if (!this.scene.children.includes(threeObject)) {
          this.scene.add(threeObject);
        }
      }

      // Update properties
      this.updateThreeObject(node, threeObject);
    }

    // Recursively update children
    for (const child of node.children) {
      this.updateScene(child, threeObject || undefined);
    }
  }

  private createThreeObject(node: Node): THREE.Object3D | null {
    // Only create objects for 3D nodes
    if (node instanceof Node3D) {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
      return new THREE.Mesh(geometry, material);
    }

    // For other nodes, create an empty group as placeholder
    return new THREE.Group();
  }

  private updateThreeObject(node: Node, threeObject: THREE.Object3D): void {
    if (node instanceof Node3D) {
      // Update position
      threeObject.position.set(node.position.x, node.position.y, node.position.z);

      // Update rotation if available
      if ("rotation" in node) {
        const rot = (node as any).rotation;
        if (rot) {
          threeObject.rotation.set(rot.x, rot.y, rot.z);
        }
      }

      // Update scale if available
      if ("scale" in node) {
        const scl = (node as any).scale;
        if (scl) {
          threeObject.scale.set(scl.x, scl.y, scl.z);
        }
      }
    }
  }

  setCamera(position: Vector3D, target: Vector3D): void {
    this.camera.position.set(position.x, position.y, position.z);
    this.camera.lookAt(target.x, target.y, target.z);
  }

  getCameraPosition(): Vector3D {
    return {
      x: this.camera.position.x,
      y: this.camera.position.y,
      z: this.camera.position.z,
    };
  }

  clear(): void {
    // Remove all objects from scene except lights
    this.scene.children = this.scene.children.filter((child) => child instanceof THREE.Light);
    this.mesh_cache.clear();
  }

  destroy(): void {
    this.renderer.dispose();
    window.removeEventListener("resize", () => this.onWindowResize());
  }
}

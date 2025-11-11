import * as THREE from "three";

export class SnowEffect {
  private scene: THREE.Scene;
  private particles: THREE.Points;
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;

  // Configuration
  private particle_count: number = 2000;
  private volume_width: number = 50;
  private volume_depth: number = 50;
  private spawn_height: number = 30;
  private despawn_height: number = -10;
  private fall_speed_min: number = 0.36;
  private fall_speed_max: number = 0.96;

  constructor(scene: THREE.Scene, camera: THREE.Camera) {
    this.scene = scene;

    // Create geometry with static attributes
    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particle_count * 3);
    const velocities = new Float32Array(this.particle_count * 3);

    // Initialize particles with static data
    for (let i = 0; i < this.particle_count; i++) {
      const y = Math.random() * this.spawn_height;

      // Initial position
      positions[i * 3] = (Math.random() - 0.5) * this.volume_width;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = (Math.random() - 0.5) * this.volume_depth;

      // Velocity (never changes after this)
      velocities[i * 3] = (Math.random() - 0.5) * 0.2;
      velocities[i * 3 + 1] = -(this.fall_speed_min + Math.random() * (this.fall_speed_max - this.fall_speed_min));
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
    }

    this.geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute("velocity", new THREE.BufferAttribute(velocities, 3));

    // Create material
    this.material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.2,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.3,
      map: this.create_snowflake_texture(),
    });

    this.particles = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.particles);
  }

  private create_snowflake_texture(): THREE.Texture {
    const canvas = document.createElement("canvas");
    canvas.width = 32; // Reduced from 64x64 to 32x32 (75% less memory)
    canvas.height = 32;

    const ctx = canvas.getContext("2d");
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Create a very soft gradient with transparent edges
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.3, "rgba(255, 255, 255, 0.8)");
    gradient.addColorStop(0.6, "rgba(255, 255, 255, 0.4)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(16, 16, 16, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  update(delta_time: number): void {
    // Update particle positions via geometry
    const positions = this.geometry.attributes.position!.array as Float32Array;
    const velocities = this.geometry.attributes.velocity!.array as Float32Array;

    for (let i = 0; i < this.particle_count; i++) {
      // Apply gravity
      positions[i * 3 + 1]! += velocities[i * 3 + 1]! * delta_time;

      // Recycle if fallen too low
      if (positions[i * 3 + 1]! < this.despawn_height) {
        positions[i * 3 + 1] = this.spawn_height;
      }
    }

    (this.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }

  cleanup(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.scene.remove(this.particles);
  }
}

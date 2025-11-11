import * as THREE from "three";

interface SnowParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  original_y: number;
}

export class SnowEffect {
  private scene: THREE.Scene;
  private particles: THREE.Points;
  private particle_data: SnowParticle[] = [];
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private position_attribute: THREE.BufferAttribute;
  private time: number = 0;
  private camera: THREE.Camera;

  // Configuration
  private particle_count: number = 2000; // Tripled from 350
  private volume_width: number = 50;
  private volume_depth: number = 50;
  private spawn_height: number = 30;
  private despawn_height: number = -10;
  private fall_speed_min: number = 0.36; // 1.2x faster (0.3 * 1.2)
  private fall_speed_max: number = 0.96; // 1.2x faster (0.8 * 1.2)

  constructor(scene: THREE.Scene, camera: THREE.Camera) {
    this.scene = scene;
    this.camera = camera;

    // Create geometry
    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particle_count * 3);
    const sizes = new Float32Array(this.particle_count);

    // Initialize particles
    for (let i = 0; i < this.particle_count; i++) {
      const particle = this.create_particle();
      this.particle_data.push(particle);

      positions[i * 3] = particle.position.x;
      positions[i * 3 + 1] = particle.position.y;
      positions[i * 3 + 2] = particle.position.z;

      sizes[i] = 0.15 + Math.random() * 0.25;
    }

    this.geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    this.position_attribute = this.geometry.attributes.position as THREE.BufferAttribute;

    // Create shader material - use simple PointsMaterial instead of custom shader
    this.material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.3,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.2, // Almost transparent
      map: this.create_snowflake_texture(),
    });

    this.particles = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.particles);
  }

  private create_particle(): SnowParticle {
    const y = Math.random() * this.spawn_height;
    const particle: SnowParticle = {
      position: new THREE.Vector3(
        (Math.random() - 0.5) * this.volume_width,
        y,
        (Math.random() - 0.5) * this.volume_depth
      ),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.2,
        -(this.fall_speed_min + Math.random() * (this.fall_speed_max - this.fall_speed_min)),
        (Math.random() - 0.5) * 0.2
      ),
      original_y: y,
    };
    return particle;
  }

  private create_snowflake_texture(): THREE.Texture {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;

    const ctx = canvas.getContext("2d");
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Create a very soft gradient with transparent edges
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.3, "rgba(255, 255, 255, 0.8)");
    gradient.addColorStop(0.6, "rgba(255, 255, 255, 0.4)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)"); // Almost transparent at edges

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(32, 32, 32, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  update(delta_time: number): void {
    this.time += delta_time;

    // Update particle positions with simple physics
    const positions = this.position_attribute.array as Float32Array;
    const wind_x = Math.sin(this.time * 0.3) * 0.2;
    const wind_z = Math.cos(this.time * 0.2) * 0.2;

    for (let i = 0; i < this.particle_count; i++) {
      const particle = this.particle_data[i]!;

      // Apply gravity
      particle.position.y += particle.velocity.y * delta_time;

      // Apply wind drift with sine wave
      particle.position.x += (particle.velocity.x + wind_x) * delta_time;
      particle.position.z += (particle.velocity.z + wind_z) * delta_time;

      // Recycle particle if it falls too low
      if (particle.position.y < this.despawn_height) {
        particle.position.y = this.spawn_height;
        particle.position.x = (Math.random() - 0.5) * this.volume_width;
        particle.position.z = (Math.random() - 0.5) * this.volume_depth;
      }

      // Update geometry
      positions[i * 3] = particle.position.x;
      positions[i * 3 + 1] = particle.position.y;
      positions[i * 3 + 2] = particle.position.z;
    }

    this.position_attribute.needsUpdate = true;
  }

  cleanup(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.scene.remove(this.particles);
  }
}

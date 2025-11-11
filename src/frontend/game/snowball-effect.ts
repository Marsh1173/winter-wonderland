import * as THREE from "three";

export class SnowballEffect {
  private scene: THREE.Scene;
  private particles: THREE.Points[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /**
   * Show a snowball throw effect - trajectory from start position in given direction
   */
  show_throw_effect(start_position: { x: number; y: number; z: number }, direction: number): void {
    // Create a simple particle effect
    const particle_geometry = new THREE.BufferGeometry();
    const particle_count = 20;
    const positions = new Float32Array(particle_count * 3);

    // Distribute particles along the throw direction
    for (let i = 0; i < particle_count; i++) {
      const t = i / particle_count;
      positions[i * 3] = start_position.x + Math.cos(direction) * t * 5;
      positions[i * 3 + 1] = start_position.y;
      positions[i * 3 + 2] = start_position.z + Math.sin(direction) * t * 5;
    }

    particle_geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const particle_material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.2,
      opacity: 1,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(particle_geometry, particle_material);
    this.scene.add(particles);
    this.particles.push(particles);

    // Animate and remove particles
    this.animate_particles(particles, particle_material);
  }

  private animate_particles(particles: THREE.Points, material: THREE.PointsMaterial): void {
    const start_time = Date.now();
    const duration = 500; // 500ms animation

    const animate = () => {
      const elapsed = Date.now() - start_time;
      const progress = Math.min(elapsed / duration, 1);

      // Fade out
      material.opacity = 1 - progress;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Remove particles
        this.scene.remove(particles);
        this.particles = this.particles.filter((p) => p !== particles);
      }
    };

    animate();
  }

  cleanup(): void {
    for (const particles of this.particles) {
      this.scene.remove(particles);
    }
    this.particles = [];
  }
}

import { noise } from '../physics/noise';
import { Particle } from '../physics/particle';
import { Vector } from '../physics/vector';
import { getBgColor } from '../utils/theme';

type ForceMode = 'gravity' | 'attract' | 'noise' | 'repel';

export class Demo06Force {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private mouse: Vector;
  private time: number = 0;
  private animationId: number = 0;
  private activeForces: Set<ForceMode> = new Set(['attract']);

  // Controllable force strengths
  private gravityStrength: number = 0.15;
  private attractStrength: number = 0.5;
  private noiseStrength: number = 0.2;
  private repelStrength: number = 0.8;
  private damping: number = 0.98;
  private particleCount: number = 100;

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.mouse = new Vector(0, 0);
    this.resize();
    this.setupControls();
    this.setupMouse();
    window.addEventListener('resize', () => this.resize());
  }

  private resize(): void {
    this.canvas.width = this.canvas.offsetWidth * window.devicePixelRatio;
    this.canvas.height = this.canvas.offsetHeight * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  private setupControls(): void {
    // Force toggle buttons
    const buttons = document.querySelectorAll('[data-force]');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const force = btn.getAttribute('data-force') as ForceMode;
        if (this.activeForces.has(force)) {
          this.activeForces.delete(force);
          btn.classList.remove('active');
        } else {
          this.activeForces.add(force);
          btn.classList.add('active');
        }
      });
    });

    // Strength sliders
    this.setupSlider('force-gravity-strength', (v) => {
      this.gravityStrength = v;
      this.updateValueDisplay('force-gravity-value', v.toFixed(2));
    });

    this.setupSlider('force-attract-strength', (v) => {
      this.attractStrength = v;
      this.updateValueDisplay('force-attract-value', v.toFixed(2));
    });

    this.setupSlider('force-noise-strength', (v) => {
      this.noiseStrength = v;
      this.updateValueDisplay('force-noise-value', v.toFixed(2));
    });

    this.setupSlider('force-repel-strength', (v) => {
      this.repelStrength = v;
      this.updateValueDisplay('force-repel-value', v.toFixed(2));
    });

    this.setupSlider('force-damping', (v) => {
      this.damping = v;
      this.updateValueDisplay('force-damping-value', v.toFixed(3));
    });

    this.setupSlider('force-particle-count', (v) => {
      this.particleCount = Math.floor(v);
      this.updateValueDisplay('force-particle-count-value', this.particleCount.toString());
      this.resetParticles();
    });
  }

  private setupSlider(id: string, callback: (value: number) => void): void {
    const slider = document.getElementById(id) as HTMLInputElement;
    if (slider) {
      slider.addEventListener('input', (e) => {
        callback(parseFloat((e.target as HTMLInputElement).value));
      });
    }
  }

  private updateValueDisplay(id: string, value: string): void {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  private resetParticles(): void {
    const w = this.canvas.offsetWidth;
    const h = this.canvas.offsetHeight;

    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push(
        new Particle(Math.random() * w, Math.random() * h, {
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          radius: 3 + Math.random() * 3,
        }),
      );
    }
  }

  private setupMouse(): void {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.mouse.x = this.canvas.offsetWidth / 2;
      this.mouse.y = this.canvas.offsetHeight / 2;
    });
  }

  start(): void {
    const w = this.canvas.offsetWidth;
    const h = this.canvas.offsetHeight;
    this.mouse = new Vector(w / 2, h / 2);

    this.resetParticles();
    this.animate();
  }

  stop(): void {
    cancelAnimationFrame(this.animationId);
    this.particles = [];
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);

    const w = this.canvas.offsetWidth;
    const h = this.canvas.offsetHeight;

    this.ctx.fillStyle = getBgColor(0.15);
    this.ctx.fillRect(0, 0, w, h);

    this.time += 0.01;

    for (const p of this.particles) {
      // Apply active forces
      if (this.activeForces.has('gravity')) {
        p.applyForce(new Vector(0, this.gravityStrength));
      }

      if (this.activeForces.has('attract')) {
        const dir = Vector.sub(this.mouse, p.pos);
        const dist = dir.mag();
        if (dist > 5) {
          dir.normalize();
          const strength = Math.min(50 / (dist * 0.5), this.attractStrength);
          dir.mult(strength);
          p.applyForce(dir);
        }
      }

      if (this.activeForces.has('repel')) {
        const dir = Vector.sub(p.pos, this.mouse);
        const dist = dir.mag();
        if (dist < 150 && dist > 5) {
          dir.normalize();
          const strength = ((150 - dist) / 150) * this.repelStrength;
          dir.mult(strength);
          p.applyForce(dir);
        }
      }

      if (this.activeForces.has('noise')) {
        const n = noise.noise2D(p.pos.x * 0.01 + this.time, p.pos.y * 0.01);
        const angle = n * Math.PI * 2;
        const noiseForce = Vector.fromAngle(angle).mult(this.noiseStrength);
        p.applyForce(noiseForce);
      }

      // Damping
      p.vel.mult(this.damping);

      // Update
      p.updateEuler();

      // Edges
      p.edges(w, h, true);

      // Draw with color based on velocity
      const speed = p.vel.mag();
      const hue = Math.min(speed * 15, 30); // Red spectrum (0-30)
      this.ctx.beginPath();
      this.ctx.arc(p.pos.x, p.pos.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `hsla(${hue}, 80%, 60%, 0.8)`;
      this.ctx.fill();
    }

    // Draw mouse indicator based on active forces
    if (this.activeForces.has('attract')) {
      this.ctx.beginPath();
      this.ctx.arc(this.mouse.x, this.mouse.y, 20, 0, Math.PI * 2);
      this.ctx.strokeStyle = 'rgba(248, 113, 113, 0.5)';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      // Draw force field indicator (inward arrows)
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
        const x = this.mouse.x + Math.cos(angle) * 35;
        const y = this.mouse.y + Math.sin(angle) * 35;
        const endX = this.mouse.x + Math.cos(angle) * 25;
        const endY = this.mouse.y + Math.sin(angle) * 25;

        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(endX, endY);
        this.ctx.strokeStyle = 'rgba(248, 113, 113, 0.3)';
        this.ctx.stroke();
      }
    }

    if (this.activeForces.has('repel')) {
      this.ctx.beginPath();
      this.ctx.arc(this.mouse.x, this.mouse.y, 25, 0, Math.PI * 2);
      this.ctx.strokeStyle = 'rgba(250, 204, 21, 0.5)';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      // Draw force field indicator (outward arrows)
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
        const x = this.mouse.x + Math.cos(angle) * 30;
        const y = this.mouse.y + Math.sin(angle) * 30;
        const endX = this.mouse.x + Math.cos(angle) * 45;
        const endY = this.mouse.y + Math.sin(angle) * 45;

        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(endX, endY);
        this.ctx.strokeStyle = 'rgba(250, 204, 21, 0.3)';
        this.ctx.stroke();
      }
    }

    // Force indicators
    this.ctx.font = '12px monospace';
    let labelX = 15;
    const labelY = 30;

    for (const force of this.activeForces) {
      const color = '#f87171';
      this.ctx.fillStyle = color;
      this.ctx.fillText(`[${force}]`, labelX, labelY);
      labelX += this.ctx.measureText(`[${force}]`).width + 15;
    }

    // Stats
    this.ctx.fillStyle = '#666';
    this.ctx.fillText(`particles: ${this.particles.length}`, 15, h - 15);
  };
}

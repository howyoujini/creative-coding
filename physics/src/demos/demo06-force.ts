import { Vector } from '../physics/vector';
import { Particle } from '../physics/particle';
import { noise } from '../physics/noise';

type ForceMode = 'gravity' | 'attract' | 'noise';

export class Demo06Force {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private mouse: Vector;
  private time: number = 0;
  private animationId: number = 0;
  private activeForces: Set<ForceMode> = new Set(['attract']);

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
    const buttons = document.querySelectorAll('[data-force]');
    buttons.forEach(btn => {
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

    // Create particles
    for (let i = 0; i < 100; i++) {
      this.particles.push(new Particle(
        Math.random() * w,
        Math.random() * h,
        {
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          radius: 3 + Math.random() * 3
        }
      ));
    }

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

    this.ctx.fillStyle = 'rgba(10, 10, 15, 0.15)';
    this.ctx.fillRect(0, 0, w, h);

    this.time += 0.01;

    for (const p of this.particles) {
      // Apply active forces
      if (this.activeForces.has('gravity')) {
        p.applyForce(new Vector(0, 0.15));
      }

      if (this.activeForces.has('attract')) {
        const dir = Vector.sub(this.mouse, p.pos);
        const dist = dir.mag();
        if (dist > 5) {
          dir.normalize();
          const strength = Math.min(50 / (dist * 0.5), 0.5);
          dir.mult(strength);
          p.applyForce(dir);
        }
      }

      if (this.activeForces.has('noise')) {
        const n = noise.noise2D(p.pos.x * 0.01 + this.time, p.pos.y * 0.01);
        const angle = n * Math.PI * 2;
        const noiseForce = Vector.fromAngle(angle).mult(0.2);
        p.applyForce(noiseForce);
      }

      // Damping
      p.vel.mult(0.98);

      // Update
      p.updateEuler();

      // Edges
      p.edges(w, h, true);

      // Draw
      this.ctx.beginPath();
      this.ctx.arc(p.pos.x, p.pos.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(248, 113, 113, 0.8)';
      this.ctx.fill();
    }

    // Draw mouse attractor
    if (this.activeForces.has('attract')) {
      this.ctx.beginPath();
      this.ctx.arc(this.mouse.x, this.mouse.y, 20, 0, Math.PI * 2);
      this.ctx.strokeStyle = 'rgba(248, 113, 113, 0.3)';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      // Draw force field indicator
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
        const x = this.mouse.x + Math.cos(angle) * 35;
        const y = this.mouse.y + Math.sin(angle) * 35;
        const endX = this.mouse.x + Math.cos(angle) * 25;
        const endY = this.mouse.y + Math.sin(angle) * 25;

        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(endX, endY);
        this.ctx.strokeStyle = 'rgba(248, 113, 113, 0.2)';
        this.ctx.stroke();
      }
    }

    // Force indicators
    const labelY = 30;
    this.ctx.font = '12px monospace';
    let labelX = 15;

    for (const force of this.activeForces) {
      this.ctx.fillStyle = '#f87171';
      this.ctx.fillText(`[${force}]`, labelX, labelY);
      labelX += this.ctx.measureText(`[${force}]`).width + 15;
    }
  };
}

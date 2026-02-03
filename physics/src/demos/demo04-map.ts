import { Vector } from '../physics/vector';
import { noise } from '../physics/noise';

interface MapParticle {
  pos: Vector;
  vel: Vector;
  target: number;
  alpha: number;
}

export class Demo04Map {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: MapParticle[] = [];
  private time: number = 0;
  private animationId: number = 0;

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  private resize(): void {
    this.canvas.width = this.canvas.offsetWidth * window.devicePixelRatio;
    this.canvas.height = this.canvas.offsetHeight * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  start(): void {
    const w = this.canvas.offsetWidth;
    const h = this.canvas.offsetHeight;

    // Create floating particles
    for (let i = 0; i < 80; i++) {
      this.particles.push({
        pos: new Vector(Math.random() * w, Math.random() * h),
        vel: new Vector(
          (Math.random() - 0.5) * 0.5,
          (Math.random() - 0.5) * 0.5
        ),
        target: Math.floor(Math.random() * 5),
        alpha: 0.2 + Math.random() * 0.3
      });
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

    this.ctx.fillStyle = 'rgba(10, 10, 15, 0.03)';
    this.ctx.fillRect(0, 0, w, h);

    this.time += 0.01;

    // Update and draw particles
    for (const p of this.particles) {
      // Apply subtle noise force
      const n = noise.noise2D(p.pos.x * 0.003 + this.time, p.pos.y * 0.003);
      p.vel.x += n * 0.01;
      p.vel.y += noise.noise2D(p.pos.y * 0.003 + this.time, p.pos.x * 0.003) * 0.01;

      p.vel.limit(0.8);
      p.pos.add(p.vel);

      // Wrap around
      if (p.pos.x < 0) p.pos.x = w;
      if (p.pos.x > w) p.pos.x = 0;
      if (p.pos.y < 0) p.pos.y = h;
      if (p.pos.y > h) p.pos.y = 0;

      // Draw with varying opacity
      this.ctx.beginPath();
      this.ctx.arc(p.pos.x, p.pos.y, 2, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(248, 113, 113, ${p.alpha * 0.5})`;
      this.ctx.fill();
    }

    // Draw subtle connections
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const d = Vector.dist(this.particles[i].pos, this.particles[j].pos);
        if (d < 80) {
          this.ctx.beginPath();
          this.ctx.moveTo(this.particles[i].pos.x, this.particles[i].pos.y);
          this.ctx.lineTo(this.particles[j].pos.x, this.particles[j].pos.y);
          this.ctx.strokeStyle = `rgba(248, 113, 113, ${(1 - d / 80) * 0.1})`;
          this.ctx.lineWidth = 0.5;
          this.ctx.stroke();
        }
      }
    }
  };
}

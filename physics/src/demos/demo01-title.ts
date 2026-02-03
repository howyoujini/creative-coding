import { Vector } from '../physics/vector';
import { curlNoise } from '../physics/noise';

interface FlowParticle {
  pos: Vector;
  vel: Vector;
  life: number;
  maxLife: number;
  trail: Vector[];
}

export class Demo01Title {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: FlowParticle[] = [];
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

  private createParticle(): FlowParticle {
    const w = this.canvas.offsetWidth;
    const h = this.canvas.offsetHeight;
    return {
      pos: new Vector(Math.random() * w, Math.random() * h),
      vel: new Vector(0, 0),
      life: 0,
      maxLife: 200 + Math.random() * 200,
      trail: []
    };
  }

  start(): void {
    const particleCount = 150;
    for (let i = 0; i < particleCount; i++) {
      this.particles.push(this.createParticle());
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

    this.ctx.fillStyle = 'rgba(10, 10, 15, 0.05)';
    this.ctx.fillRect(0, 0, w, h);

    this.time += 0.003;

    for (const p of this.particles) {
      const curl = curlNoise(p.pos.x, p.pos.y, this.time, 0.003);

      p.vel.x += curl.x * 0.3;
      p.vel.y += curl.y * 0.3;
      p.vel.mult(0.95);
      p.vel.limit(1.5);

      p.pos.add(p.vel);
      p.life++;

      p.trail.push(p.pos.copy());
      if (p.trail.length > 30) {
        p.trail.shift();
      }

      // Draw trail
      if (p.trail.length > 2) {
        this.ctx.beginPath();
        this.ctx.moveTo(p.trail[0].x, p.trail[0].y);
        for (let i = 1; i < p.trail.length; i++) {
          this.ctx.lineTo(p.trail[i].x, p.trail[i].y);
        }
        const alpha = Math.min(p.life / 50, 1) * (1 - p.life / p.maxLife) * 0.3;
        this.ctx.strokeStyle = `rgba(248, 113, 113, ${alpha})`;
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
      }

      // Reset if out of bounds or dead
      if (p.pos.x < -50 || p.pos.x > w + 50 ||
          p.pos.y < -50 || p.pos.y > h + 50 ||
          p.life > p.maxLife) {
        const newP = this.createParticle();
        p.pos = newP.pos;
        p.vel = newP.vel;
        p.life = 0;
        p.trail = [];
      }
    }
  };
}

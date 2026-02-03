import { Vector } from '../physics/vector';

export class Demo05Particle {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private pos: Vector;
  private vel: Vector;
  private acc: Vector;
  private time: number = 0;
  private animationId: number = 0;
  private trail: Vector[] = [];

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.pos = new Vector(0, 0);
    this.vel = new Vector(0, 0);
    this.acc = new Vector(0, 0);
    this.resize();
  }

  private resize(): void {
    const parent = this.canvas.parentElement!;
    const w = parent.offsetWidth;
    const h = parent.offsetHeight;
    const dpr = window.devicePixelRatio;

    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.ctx.scale(dpr, dpr);
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';

    this.pos = new Vector(w / 2, h / 2);
    this.vel = new Vector(2, -1);
  }

  start(): void {
    this.animate();
  }

  stop(): void {
    cancelAnimationFrame(this.animationId);
    this.trail = [];
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);

    const parent = this.canvas.parentElement!;
    const w = parent.offsetWidth;
    const h = parent.offsetHeight;

    this.ctx.fillStyle = '#0a0a0f';
    this.ctx.fillRect(0, 0, w, h);

    this.time += 0.02;

    // Apply forces
    this.acc = new Vector(0, 0);

    // Gravity
    this.acc.add(new Vector(0, 0.1));

    // Oscillating horizontal force
    this.acc.add(new Vector(Math.sin(this.time) * 0.15, 0));

    // Update physics
    this.vel.add(this.acc);
    this.vel.mult(0.99); // Friction
    this.pos.add(this.vel);

    // Bounce off walls
    if (this.pos.x < 30 || this.pos.x > w - 30) {
      this.vel.x *= -0.8;
      this.pos.x = Math.max(30, Math.min(w - 30, this.pos.x));
    }
    if (this.pos.y < 30 || this.pos.y > h - 30) {
      this.vel.y *= -0.8;
      this.pos.y = Math.max(30, Math.min(h - 30, this.pos.y));
    }

    // Store trail
    this.trail.push(this.pos.copy());
    if (this.trail.length > 40) {
      this.trail.shift();
    }

    // Draw trail
    if (this.trail.length > 1) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.trail[0].x, this.trail[0].y);
      for (let i = 1; i < this.trail.length; i++) {
        this.ctx.lineTo(this.trail[i].x, this.trail[i].y);
      }
      this.ctx.strokeStyle = 'rgba(248, 113, 113, 0.2)';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }

    // Draw particle
    this.ctx.beginPath();
    this.ctx.arc(this.pos.x, this.pos.y, 16, 0, Math.PI * 2);
    this.ctx.fillStyle = '#f87171';
    this.ctx.fill();

    // Draw vectors
    this.drawVector(this.pos, Vector.mult(this.vel, 15), '#ffffff', 'velocity');
    this.drawVector(this.pos, Vector.mult(this.acc, 150), '#fbbf24', 'force');

    // Labels
    this.ctx.fillStyle = '#666';
    this.ctx.font = '12px monospace';
    this.ctx.fillText(`position: (${this.pos.x.toFixed(0)}, ${this.pos.y.toFixed(0)})`, 15, 25);
    this.ctx.fillText(`velocity: (${this.vel.x.toFixed(2)}, ${this.vel.y.toFixed(2)})`, 15, 45);
    this.ctx.fillText(`force: (${this.acc.x.toFixed(2)}, ${this.acc.y.toFixed(2)})`, 15, 65);

    // Legend
    const legendY = h - 50;
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(15, legendY, 10, 3);
    this.ctx.fillText('velocity', 30, legendY + 5);

    this.ctx.fillStyle = '#fbbf24';
    this.ctx.fillRect(15, legendY + 20, 10, 3);
    this.ctx.fillStyle = '#666';
    this.ctx.fillText('force', 30, legendY + 25);
  };

  private drawVector(origin: Vector, vec: Vector, color: string, _label: string): void {
    const end = Vector.add(origin, vec);

    this.ctx.beginPath();
    this.ctx.moveTo(origin.x, origin.y);
    this.ctx.lineTo(end.x, end.y);
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Arrow head
    const angle = vec.heading();
    const headLen = 8;
    this.ctx.beginPath();
    this.ctx.moveTo(end.x, end.y);
    this.ctx.lineTo(
      end.x - headLen * Math.cos(angle - Math.PI / 6),
      end.y - headLen * Math.sin(angle - Math.PI / 6)
    );
    this.ctx.moveTo(end.x, end.y);
    this.ctx.lineTo(
      end.x - headLen * Math.cos(angle + Math.PI / 6),
      end.y - headLen * Math.sin(angle + Math.PI / 6)
    );
    this.ctx.stroke();
  }
}

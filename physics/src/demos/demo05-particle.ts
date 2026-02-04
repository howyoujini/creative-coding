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

  // Controllable parameters
  private mass: number = 1;
  private gravity: number = 0.1;
  private friction: number = 0.99;
  private bounce: number = 0.8;
  private windStrength: number = 0.15;

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.pos = new Vector(0, 0);
    this.vel = new Vector(0, 0);
    this.acc = new Vector(0, 0);
    this.resize();
    this.setupControls();
  }

  private resize(): void {
    const parent = this.canvas.parentElement!;
    const w = parent.offsetWidth;
    const h = parent.offsetHeight;
    const dpr = window.devicePixelRatio;

    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.ctx.scale(dpr, dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;

    this.pos = new Vector(w / 2, h / 2);
    this.vel = new Vector(2, -1);
  }

  private setupControls(): void {
    const massSlider = document.getElementById('particle-mass') as HTMLInputElement;
    const gravitySlider = document.getElementById('particle-gravity') as HTMLInputElement;
    const frictionSlider = document.getElementById('particle-friction') as HTMLInputElement;
    const bounceSlider = document.getElementById('particle-bounce') as HTMLInputElement;
    const windSlider = document.getElementById('particle-wind') as HTMLInputElement;

    if (massSlider) {
      massSlider.addEventListener('input', (e) => {
        this.mass = parseFloat((e.target as HTMLInputElement).value);
        this.updateValueDisplay('particle-mass-value', this.mass.toFixed(1));
      });
    }

    if (gravitySlider) {
      gravitySlider.addEventListener('input', (e) => {
        this.gravity = parseFloat((e.target as HTMLInputElement).value);
        this.updateValueDisplay('particle-gravity-value', this.gravity.toFixed(2));
      });
    }

    if (frictionSlider) {
      frictionSlider.addEventListener('input', (e) => {
        this.friction = parseFloat((e.target as HTMLInputElement).value);
        this.updateValueDisplay('particle-friction-value', this.friction.toFixed(3));
      });
    }

    if (bounceSlider) {
      bounceSlider.addEventListener('input', (e) => {
        this.bounce = parseFloat((e.target as HTMLInputElement).value);
        this.updateValueDisplay('particle-bounce-value', this.bounce.toFixed(2));
      });
    }

    if (windSlider) {
      windSlider.addEventListener('input', (e) => {
        this.windStrength = parseFloat((e.target as HTMLInputElement).value);
        this.updateValueDisplay('particle-wind-value', this.windStrength.toFixed(2));
      });
    }
  }

  private updateValueDisplay(id: string, value: string): void {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
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

    // Apply forces (F = ma, so a = F/m)
    this.acc = new Vector(0, 0);

    // Gravity (mass affects how much it accelerates)
    this.acc.add(new Vector(0, this.gravity / this.mass));

    // Oscillating wind force
    this.acc.add(new Vector((Math.sin(this.time) * this.windStrength) / this.mass, 0));

    // Update physics
    this.vel.add(this.acc);
    this.vel.mult(this.friction);
    this.pos.add(this.vel);

    // Bounce off walls with controllable elasticity
    const radius = 16 + (this.mass - 1) * 8; // Size scales with mass
    if (this.pos.x < radius || this.pos.x > w - radius) {
      this.vel.x *= -this.bounce;
      this.pos.x = Math.max(radius, Math.min(w - radius, this.pos.x));
    }
    if (this.pos.y < radius || this.pos.y > h - radius) {
      this.vel.y *= -this.bounce;
      this.pos.y = Math.max(radius, Math.min(h - radius, this.pos.y));
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

    // Draw particle (size based on mass)
    this.ctx.beginPath();
    this.ctx.arc(this.pos.x, this.pos.y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = '#f87171';
    this.ctx.fill();

    // Draw mass indicator
    this.ctx.fillStyle = '#0a0a0f';
    this.ctx.font = `${10 + this.mass * 2}px monospace`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(`${this.mass.toFixed(1)}`, this.pos.x, this.pos.y);
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'alphabetic';

    // Draw vectors
    this.drawVector(this.pos, Vector.mult(this.vel, 15), '#ffffff', 'velocity');
    this.drawVector(this.pos, Vector.mult(this.acc, 150), '#f87171', 'force');

    // Labels
    this.ctx.fillStyle = '#666';
    this.ctx.font = '12px monospace';
    this.ctx.fillText(`position: (${this.pos.x.toFixed(0)}, ${this.pos.y.toFixed(0)})`, 15, 25);
    this.ctx.fillText(`velocity: (${this.vel.x.toFixed(2)}, ${this.vel.y.toFixed(2)})`, 15, 45);
    this.ctx.fillText(`acceleration: (${this.acc.x.toFixed(3)}, ${this.acc.y.toFixed(3)})`, 15, 65);
    this.ctx.fillText(`mass: ${this.mass.toFixed(1)}`, 15, 85);

    // Legend
    const legendY = h - 50;
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(15, legendY, 10, 3);
    this.ctx.fillText('velocity', 30, legendY + 5);

    this.ctx.fillStyle = '#f87171';
    this.ctx.fillRect(15, legendY + 20, 10, 3);
    this.ctx.fillStyle = '#666';
    this.ctx.fillText('force (a = F/m)', 30, legendY + 25);
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
      end.y - headLen * Math.sin(angle - Math.PI / 6),
    );
    this.ctx.moveTo(end.x, end.y);
    this.ctx.lineTo(
      end.x - headLen * Math.cos(angle + Math.PI / 6),
      end.y - headLen * Math.sin(angle + Math.PI / 6),
    );
    this.ctx.stroke();
  }
}

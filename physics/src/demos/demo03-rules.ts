import { Vector } from '../physics/vector';
import { noise } from '../physics/noise';

type RuleType = 'linear' | 'circular' | 'noise' | 'spring';

export class Demo03Rules {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private time: number = 0;
  private animationId: number = 0;
  private currentRule: RuleType = 'linear';
  private pos: Vector;
  private vel: Vector;
  private target: Vector;
  private trail: Vector[] = [];

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.pos = new Vector(0, 0);
    this.vel = new Vector(0, 0);
    this.target = new Vector(0, 0);
    this.resize();
    this.setupControls();
    window.addEventListener('resize', () => this.resize());
  }

  private resize(): void {
    this.canvas.width = this.canvas.offsetWidth * window.devicePixelRatio;
    this.canvas.height = this.canvas.offsetHeight * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const w = this.canvas.offsetWidth;
    const h = this.canvas.offsetHeight;
    this.pos = new Vector(w / 2, h / 2);
    this.target = new Vector(w / 2, h / 2);
  }

  private setupControls(): void {
    const buttons = document.querySelectorAll('[data-rule]');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentRule = btn.getAttribute('data-rule') as RuleType;
        this.trail = [];
        this.time = 0;
      });
    });
  }

  setRule(rule: RuleType): void {
    this.currentRule = rule;
    this.trail = [];
    this.time = 0;
  }

  start(): void {
    this.animate();
  }

  stop(): void {
    cancelAnimationFrame(this.animationId);
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);

    const w = this.canvas.offsetWidth;
    const h = this.canvas.offsetHeight;
    const cx = w / 2;
    const cy = h / 2;

    this.ctx.fillStyle = 'rgba(10, 10, 15, 0.08)';
    this.ctx.fillRect(0, 0, w, h);

    this.time += 0.02;

    // Apply different rules
    switch (this.currentRule) {
      case 'linear':
        this.target.x = cx + Math.sin(this.time) * 200;
        this.target.y = cy;
        this.pos.lerp(this.target, 0.1);
        break;

      case 'circular':
        const radius = 120;
        this.target.x = cx + Math.cos(this.time) * radius;
        this.target.y = cy + Math.sin(this.time) * radius;
        this.pos.lerp(this.target, 0.15);
        break;

      case 'noise':
        const n1 = noise.noise2D(this.time * 0.5, 0);
        const n2 = noise.noise2D(0, this.time * 0.5);
        this.target.x = cx + n1 * 180;
        this.target.y = cy + n2 * 180;
        this.pos.lerp(this.target, 0.05);
        break;

      case 'spring':
        const springTarget = new Vector(
          cx + Math.sin(this.time * 0.5) * 150,
          cy + Math.cos(this.time * 0.3) * 100
        );
        const force = Vector.sub(springTarget, this.pos);
        force.mult(0.03);
        this.vel.add(force);
        this.vel.mult(0.92);
        this.pos.add(this.vel);
        break;
    }

    // Store trail
    this.trail.push(this.pos.copy());
    if (this.trail.length > 80) {
      this.trail.shift();
    }

    // Draw trail
    if (this.trail.length > 2) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.trail[0].x, this.trail[0].y);
      for (let i = 1; i < this.trail.length; i++) {
        this.ctx.lineTo(this.trail[i].x, this.trail[i].y);
      }
      this.ctx.strokeStyle = 'rgba(248, 113, 113, 0.3)';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }

    // Draw point
    this.ctx.beginPath();
    this.ctx.arc(this.pos.x, this.pos.y, 12, 0, Math.PI * 2);
    this.ctx.fillStyle = '#f87171';
    this.ctx.fill();

    // Draw rule name
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.font = '14px monospace';
    this.ctx.fillText(`Rule: ${this.currentRule}`, 20, 30);
  };
}

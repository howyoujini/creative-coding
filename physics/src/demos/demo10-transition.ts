import { noise } from '../physics/noise';
import { Vector } from '../physics/vector';
import { getBgColor } from '../utils/theme';

interface TransitionParticle {
  pos: Vector;
  vel: Vector;
  basePos: Vector;
  phase: number;
}

export class Demo10Transition {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: TransitionParticle[] = [];
  private time: number = 0;
  private animationId: number = 0;
  private transitionProgress: number = 0;

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

    // Create a grid that will transform from object-based to flow-based
    const cols = 20;
    const rows = 15;
    const spacingX = w / (cols + 1);
    const spacingY = h / (rows + 1);

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = spacingX * (i + 1);
        const y = spacingY * (j + 1);
        this.particles.push({
          pos: new Vector(x, y),
          vel: new Vector(0, 0),
          basePos: new Vector(x, y),
          phase: (i + j) * 0.3,
        });
      }
    }

    this.animate();
  }

  stop(): void {
    cancelAnimationFrame(this.animationId);
    this.particles = [];
    this.transitionProgress = 0;
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);

    const w = this.canvas.offsetWidth;
    const h = this.canvas.offsetHeight;

    this.ctx.fillStyle = getBgColor(0.1);
    this.ctx.fillRect(0, 0, w, h);

    this.time += 0.015;

    // Oscillate transition progress
    this.transitionProgress = (Math.sin(this.time * 0.3) + 1) / 2;

    for (const p of this.particles) {
      // Object-based motion (each particle has its own oscillation)
      const objectX = p.basePos.x + Math.sin(this.time + p.phase) * 15;
      const objectY = p.basePos.y + Math.cos(this.time * 0.8 + p.phase) * 15;

      // Space-based motion (particles follow flow field)
      const n = noise.noise3D(p.pos.x * 0.005, p.pos.y * 0.005, this.time * 0.5);
      const angle = n * Math.PI * 2;
      const flowX = p.pos.x + Math.cos(angle) * 1.5;
      const flowY = p.pos.y + Math.sin(angle) * 1.5;

      // Interpolate between two modes
      const targetX = objectX * (1 - this.transitionProgress) + flowX * this.transitionProgress;
      const targetY = objectY * (1 - this.transitionProgress) + flowY * this.transitionProgress;

      // Smoothly move towards target
      p.pos.x += (targetX - p.pos.x) * 0.1;
      p.pos.y += (targetY - p.pos.y) * 0.1;

      // Wrap in flow mode
      if (this.transitionProgress > 0.5) {
        if (p.pos.x < 0) p.pos.x = w;
        if (p.pos.x > w) p.pos.x = 0;
        if (p.pos.y < 0) p.pos.y = h;
        if (p.pos.y > h) p.pos.y = 0;
      }

      // Draw particle
      const alpha = 0.3 + this.transitionProgress * 0.5;
      this.ctx.beginPath();
      this.ctx.arc(p.pos.x, p.pos.y, 3, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(248, 113, 113, ${alpha})`;
      this.ctx.fill();
    }

    // Mode indicator
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.font = '14px monospace';
    const modeText = this.transitionProgress < 0.5 ? '← Object Motion' : 'Space Motion →';
    this.ctx.fillText(modeText, 20, 30);

    // Progress bar
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.fillRect(20, 45, 150, 4);
    this.ctx.fillStyle = '#f87171';
    this.ctx.fillRect(20, 45, 150 * this.transitionProgress, 4);
  };
}

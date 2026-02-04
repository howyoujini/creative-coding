import { noise } from '../physics/noise';
import { Vector } from '../physics/vector';
import { getBgColor } from '../utils/theme';

interface Dot {
  pos: Vector;
  vel: Vector;
  basePos: Vector;
  phase: number;
}

export class Demo02Random {
  private canvasLeft: HTMLCanvasElement;
  private canvasRight: HTMLCanvasElement;
  private ctxLeft: CanvasRenderingContext2D;
  private ctxRight: CanvasRenderingContext2D;
  private dotsLeft: Dot[] = [];
  private dotsRight: Dot[] = [];
  private time: number = 0;
  private animationId: number = 0;

  constructor(leftId: string, rightId: string) {
    this.canvasLeft = document.getElementById(leftId) as HTMLCanvasElement;
    this.canvasRight = document.getElementById(rightId) as HTMLCanvasElement;
    this.ctxLeft = this.canvasLeft.getContext('2d')!;
    this.ctxRight = this.canvasRight.getContext('2d')!;
    this.resize();
  }

  private resize(): void {
    const parent = this.canvasLeft.parentElement!;
    const w = parent.offsetWidth;
    const h = parent.offsetHeight;
    const dpr = window.devicePixelRatio;

    this.canvasLeft.width = w * dpr;
    this.canvasLeft.height = h * dpr;
    this.canvasRight.width = w * dpr;
    this.canvasRight.height = h * dpr;

    this.ctxLeft.scale(dpr, dpr);
    this.ctxRight.scale(dpr, dpr);

    this.canvasLeft.style.width = `${w}px`;
    this.canvasLeft.style.height = `${h}px`;
    this.canvasRight.style.width = `${w}px`;
    this.canvasRight.style.height = `${h}px`;
  }

  start(): void {
    const parent = this.canvasLeft.parentElement!;
    const w = parent.offsetWidth;
    const h = parent.offsetHeight;

    this.dotsLeft = [];
    this.dotsRight = [];

    // Create dots in a grid pattern
    const cols = 10;
    const rows = 6;
    const spacingX = w / (cols + 1);
    const spacingY = h / (rows + 1);

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = spacingX * (i + 1);
        const y = spacingY * (j + 1);

        this.dotsLeft.push({
          pos: new Vector(x, y),
          vel: new Vector(0, 0),
          basePos: new Vector(x, y),
          phase: Math.random() * Math.PI * 2,
        });

        this.dotsRight.push({
          pos: new Vector(x, y),
          vel: new Vector(0, 0),
          basePos: new Vector(x, y),
          phase: (i + j) * 0.5,
        });
      }
    }

    this.animate();
  }

  stop(): void {
    cancelAnimationFrame(this.animationId);
    this.dotsLeft = [];
    this.dotsRight = [];
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);

    const parent = this.canvasLeft.parentElement!;
    const w = parent.offsetWidth;
    const h = parent.offsetHeight;

    // Clear
    this.ctxLeft.fillStyle = getBgColor(0.15);
    this.ctxLeft.fillRect(0, 0, w, h);
    this.ctxRight.fillStyle = getBgColor(0.15);
    this.ctxRight.fillRect(0, 0, w, h);

    this.time += 0.02;

    // Left: Pure random - jumps to random positions
    for (const dot of this.dotsLeft) {
      if (Math.random() < 0.05) {
        dot.pos.x = dot.basePos.x + (Math.random() - 0.5) * 40;
        dot.pos.y = dot.basePos.y + (Math.random() - 0.5) * 40;
      }

      this.ctxLeft.beginPath();
      this.ctxLeft.arc(dot.pos.x, dot.pos.y, 4, 0, Math.PI * 2);
      this.ctxLeft.fillStyle = 'rgba(248, 113, 113, 0.8)';
      this.ctxLeft.fill();
    }

    // Right: Time-accumulated - smooth wave motion
    for (const dot of this.dotsRight) {
      const n = noise.noise2D(dot.basePos.x * 0.01, dot.basePos.y * 0.01 + this.time);
      dot.pos.x = dot.basePos.x + Math.sin(this.time + dot.phase) * 15;
      dot.pos.y = dot.basePos.y + Math.cos(this.time * 0.8 + dot.phase) * 15 + n * 10;

      this.ctxRight.beginPath();
      this.ctxRight.arc(dot.pos.x, dot.pos.y, 4, 0, Math.PI * 2);
      this.ctxRight.fillStyle = 'rgba(248, 113, 113, 0.8)';
      this.ctxRight.fill();
    }
  };
}

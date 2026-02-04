import { Vector } from '../physics/vector';
import { getBgColor } from '../utils/theme';

interface SpringPoint {
  pos: Vector;
  vel: Vector;
  target: Vector;
  trail: Vector[];
}

export class Demo08Spring {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private points: SpringPoint[] = [];
  private mouse: Vector;
  private isDragging: boolean = false;
  private animationId: number = 0;

  // Spring parameters
  private stiffness: number = 0.08;
  private damping: number = 0.92;

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
    const dampingSlider = document.getElementById('damping-slider') as HTMLInputElement;
    const stiffnessSlider = document.getElementById('stiffness-slider') as HTMLInputElement;

    if (dampingSlider) {
      dampingSlider.addEventListener('input', (e) => {
        this.damping = parseFloat((e.target as HTMLInputElement).value);
      });
    }

    if (stiffnessSlider) {
      stiffnessSlider.addEventListener('input', (e) => {
        this.stiffness = parseFloat((e.target as HTMLInputElement).value);
      });
    }
  }

  private setupMouse(): void {
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.updateMouse(e);
    });

    this.canvas.addEventListener('mousemove', (e) => {
      this.updateMouse(e);
    });

    this.canvas.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.isDragging = false;
    });
  }

  private updateMouse(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = e.clientX - rect.left;
    this.mouse.y = e.clientY - rect.top;
  }

  start(): void {
    const w = this.canvas.offsetWidth;
    const h = this.canvas.offsetHeight;
    const cx = w / 2;
    const cy = h / 2;

    this.mouse = new Vector(cx, cy);

    // Create a grid of spring points
    const cols = 5;
    const rows = 4;
    const spacingX = w / (cols + 1);
    const spacingY = h / (rows + 1);

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = spacingX * (i + 1);
        const y = spacingY * (j + 1);
        this.points.push({
          pos: new Vector(x, y),
          vel: new Vector(0, 0),
          target: new Vector(x, y),
          trail: [],
        });
      }
    }

    this.animate();
  }

  stop(): void {
    cancelAnimationFrame(this.animationId);
    this.points = [];
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);

    const w = this.canvas.offsetWidth;
    const h = this.canvas.offsetHeight;

    this.ctx.fillStyle = getBgColor(0.1);
    this.ctx.fillRect(0, 0, w, h);

    for (const point of this.points) {
      // Calculate spring force towards target
      let target = point.target;

      // If dragging, add influence from mouse
      if (this.isDragging) {
        const distToMouse = Vector.dist(point.target, this.mouse);
        const influence = Math.max(0, 1 - distToMouse / 200);
        if (influence > 0) {
          target = Vector.lerp(point.target, this.mouse, influence * 0.8);
        }
      }

      // Spring physics
      const force = Vector.sub(target, point.pos);
      force.mult(this.stiffness);

      point.vel.add(force);
      point.vel.mult(this.damping);
      point.pos.add(point.vel);

      // Trail
      point.trail.push(point.pos.copy());
      if (point.trail.length > 20) point.trail.shift();

      // Draw trail
      if (point.trail.length > 1) {
        this.ctx.beginPath();
        this.ctx.moveTo(point.trail[0].x, point.trail[0].y);
        for (let i = 1; i < point.trail.length; i++) {
          this.ctx.lineTo(point.trail[i].x, point.trail[i].y);
        }
        this.ctx.strokeStyle = 'rgba(248, 113, 113, 0.15)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
      }

      // Draw spring line
      this.ctx.beginPath();
      this.ctx.moveTo(point.target.x, point.target.y);
      this.ctx.lineTo(point.pos.x, point.pos.y);
      this.ctx.strokeStyle = 'rgba(248, 113, 113, 0.2)';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();

      // Draw anchor
      this.ctx.beginPath();
      this.ctx.arc(point.target.x, point.target.y, 4, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(248, 113, 113, 0.3)';
      this.ctx.fill();

      // Draw point with size based on velocity
      const velMag = point.vel.mag();
      const size = 8 + velMag * 2;
      this.ctx.beginPath();
      this.ctx.arc(point.pos.x, point.pos.y, size, 0, Math.PI * 2);
      this.ctx.fillStyle = '#f87171';
      this.ctx.fill();
    }

    // Draw mouse indicator when dragging
    if (this.isDragging) {
      this.ctx.beginPath();
      this.ctx.arc(this.mouse.x, this.mouse.y, 30, 0, Math.PI * 2);
      this.ctx.strokeStyle = 'rgba(248, 113, 113, 0.3)';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }

    // Parameters display
    this.ctx.fillStyle = '#666';
    this.ctx.font = '12px monospace';
    this.ctx.fillText(`stiffness: ${this.stiffness.toFixed(2)}`, 15, 25);
    this.ctx.fillText(`damping: ${this.damping.toFixed(2)}`, 15, 45);
  };
}

import { Vector } from '../physics/vector';
import { noise } from '../physics/noise';

interface FlowParticle {
  pos: Vector;
  vel: Vector;
  life: number;
}

export class Demo11FlowField {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: FlowParticle[] = [];
  private flowField: number[][] = [];
  private time: number = 0;
  private animationId: number = 0;
  private showVectors: boolean = true;

  private resolution: number = 25;
  private cols: number = 0;
  private rows: number = 0;

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
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

    this.cols = Math.ceil(w / this.resolution);
    this.rows = Math.ceil(h / this.resolution);

    // Initialize flow field
    this.flowField = [];
    for (let i = 0; i < this.cols * this.rows; i++) {
      this.flowField[i] = [0];
    }
  }

  private setupControls(): void {
    const buttons = document.querySelectorAll('[data-show]');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.showVectors = btn.getAttribute('data-show') === 'vectors';
      });
    });
  }

  start(): void {
    const w = this.canvas.offsetWidth;
    const h = this.canvas.offsetHeight;

    // Create particles
    for (let i = 0; i < 500; i++) {
      this.particles.push({
        pos: new Vector(Math.random() * w, Math.random() * h),
        vel: new Vector(0, 0),
        life: Math.random() * 200
      });
    }

    this.animate();
  }

  stop(): void {
    cancelAnimationFrame(this.animationId);
    this.particles = [];
  }

  private updateFlowField(): void {
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const idx = x + y * this.cols;
        const n = noise.noise3D(x * 0.1, y * 0.1, this.time * 0.3);
        this.flowField[idx] = [n * Math.PI * 2];
      }
    }
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);

    const w = this.canvas.offsetWidth;
    const h = this.canvas.offsetHeight;

    // Clear with transparency for trails
    this.ctx.fillStyle = 'rgba(10, 10, 15, 0.1)';
    this.ctx.fillRect(0, 0, w, h);

    this.time += 0.01;
    this.updateFlowField();

    // Draw flow field vectors
    if (this.showVectors) {
      for (let y = 0; y < this.rows; y++) {
        for (let x = 0; x < this.cols; x++) {
          const idx = x + y * this.cols;
          const angle = this.flowField[idx][0];

          const px = x * this.resolution + this.resolution / 2;
          const py = y * this.resolution + this.resolution / 2;
          const len = this.resolution * 0.4;

          const endX = px + Math.cos(angle) * len;
          const endY = py + Math.sin(angle) * len;

          this.ctx.beginPath();
          this.ctx.moveTo(px, py);
          this.ctx.lineTo(endX, endY);
          this.ctx.strokeStyle = 'rgba(248, 113, 113, 0.15)';
          this.ctx.lineWidth = 1;
          this.ctx.stroke();

          // Arrow head
          const headLen = 4;
          this.ctx.beginPath();
          this.ctx.moveTo(endX, endY);
          this.ctx.lineTo(
            endX - headLen * Math.cos(angle - Math.PI / 6),
            endY - headLen * Math.sin(angle - Math.PI / 6)
          );
          this.ctx.moveTo(endX, endY);
          this.ctx.lineTo(
            endX - headLen * Math.cos(angle + Math.PI / 6),
            endY - headLen * Math.sin(angle + Math.PI / 6)
          );
          this.ctx.stroke();
        }
      }
    }

    // Update and draw particles
    for (const p of this.particles) {
      // Get flow field angle at particle position
      const x = Math.floor(p.pos.x / this.resolution);
      const y = Math.floor(p.pos.y / this.resolution);
      const idx = Math.max(0, Math.min(x + y * this.cols, this.flowField.length - 1));
      const angle = this.flowField[idx]?.[0] || 0;

      // Apply force from flow field
      const force = Vector.fromAngle(angle).mult(0.2);
      p.vel.add(force);
      p.vel.limit(2);
      p.pos.add(p.vel);

      p.life--;

      // Reset if out of bounds or dead
      if (p.pos.x < 0 || p.pos.x > w || p.pos.y < 0 || p.pos.y > h || p.life <= 0) {
        p.pos = new Vector(Math.random() * w, Math.random() * h);
        p.vel = new Vector(0, 0);
        p.life = 100 + Math.random() * 100;
      }

      // Draw particle
      this.ctx.beginPath();
      this.ctx.arc(p.pos.x, p.pos.y, 1.5, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(248, 113, 113, 0.8)';
      this.ctx.fill();
    }
  };
}

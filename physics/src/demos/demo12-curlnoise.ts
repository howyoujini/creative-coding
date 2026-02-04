import { curlNoise } from '../physics/noise';
import { Vector } from '../physics/vector';
import { getBgColor } from '../utils/theme';

interface CurlParticle {
  pos: Vector;
  vel: Vector;
  trail: Vector[];
  life: number;
  maxLife: number;
}

export class Demo12CurlNoise {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: CurlParticle[] = [];
  private time: number = 0;
  private animationId: number = 0;

  private scale: number = 0.004;
  private intensity: number = 1.5;

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
  }

  private setupControls(): void {
    const scaleSlider = document.getElementById('curl-scale') as HTMLInputElement;
    const intensitySlider = document.getElementById('curl-intensity') as HTMLInputElement;

    if (scaleSlider) {
      scaleSlider.addEventListener('input', (e) => {
        this.scale = parseFloat((e.target as HTMLInputElement).value);
      });
    }

    if (intensitySlider) {
      intensitySlider.addEventListener('input', (e) => {
        this.intensity = parseFloat((e.target as HTMLInputElement).value);
      });
    }
  }

  private createParticle(): CurlParticle {
    const w = this.canvas.offsetWidth;
    const h = this.canvas.offsetHeight;

    return {
      pos: new Vector(Math.random() * w, Math.random() * h),
      vel: new Vector(0, 0),
      trail: [],
      life: 0,
      maxLife: 150 + Math.random() * 150,
    };
  }

  start(): void {
    for (let i = 0; i < 300; i++) {
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

    // Very subtle fade for long trails
    this.ctx.fillStyle = getBgColor(0.03);
    this.ctx.fillRect(0, 0, w, h);

    this.time += 0.005;

    for (const p of this.particles) {
      // Get curl noise at particle position
      const curl = curlNoise(p.pos.x, p.pos.y, this.time, this.scale);

      // Apply curl force
      p.vel.x += curl.x * this.intensity * 0.3;
      p.vel.y += curl.y * this.intensity * 0.3;
      p.vel.mult(0.96);
      p.vel.limit(3);

      p.pos.add(p.vel);
      p.life++;

      // Store trail
      p.trail.push(p.pos.copy());
      if (p.trail.length > 40) {
        p.trail.shift();
      }

      // Draw trail with gradient
      if (p.trail.length > 2) {
        this.ctx.beginPath();
        this.ctx.moveTo(p.trail[0].x, p.trail[0].y);
        for (let i = 1; i < p.trail.length; i++) {
          this.ctx.lineTo(p.trail[i].x, p.trail[i].y);
        }

        const lifeRatio = Math.min(p.life / 30, 1) * (1 - p.life / p.maxLife);
        this.ctx.strokeStyle = `rgba(248, 113, 113, ${lifeRatio * 0.4})`;
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();
      }

      // Reset if out of bounds or dead
      if (
        p.pos.x < -50 ||
        p.pos.x > w + 50 ||
        p.pos.y < -50 ||
        p.pos.y > h + 50 ||
        p.life > p.maxLife
      ) {
        const newP = this.createParticle();
        p.pos = newP.pos;
        p.vel = newP.vel;
        p.trail = [];
        p.life = 0;
      }
    }

    // Parameters display
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.font = '12px monospace';
    this.ctx.fillText(`scale: ${this.scale.toFixed(4)}`, 15, 25);
    this.ctx.fillText(`intensity: ${this.intensity.toFixed(1)}`, 15, 45);
  };
}

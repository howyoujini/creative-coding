import { Vector } from '../physics/vector';
import { curlNoise } from '../physics/noise';

interface ClosingParticle {
  pos: Vector;
  vel: Vector;
  trail: Vector[];
  hue: number;
  life: number;
  maxLife: number;
}

export class Demo15Closing {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: ClosingParticle[] = [];
  private time: number = 0;
  private animationId: number = 0;
  private phase: number = 0;

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

  private createParticle(): ClosingParticle {
    const w = this.canvas.offsetWidth;
    const h = this.canvas.offsetHeight;

    // Spawn from edges or center based on phase
    let x: number, y: number;
    if (Math.random() < 0.5) {
      // Edge spawn
      const edge = Math.floor(Math.random() * 4);
      switch (edge) {
        case 0: x = Math.random() * w; y = 0; break;
        case 1: x = w; y = Math.random() * h; break;
        case 2: x = Math.random() * w; y = h; break;
        default: x = 0; y = Math.random() * h; break;
      }
    } else {
      // Center spawn
      x = w / 2 + (Math.random() - 0.5) * 100;
      y = h / 2 + (Math.random() - 0.5) * 100;
    }

    return {
      pos: new Vector(x, y),
      vel: new Vector(0, 0),
      trail: [],
      hue: 0 + Math.random() * 15, // Red range
      life: 0,
      maxLife: 200 + Math.random() * 200
    };
  }

  start(): void {
    for (let i = 0; i < 200; i++) {
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
    const cx = w / 2;
    const cy = h / 2;

    // Very subtle fade
    this.ctx.fillStyle = 'rgba(10, 10, 15, 0.02)';
    this.ctx.fillRect(0, 0, w, h);

    this.time += 0.003;
    this.phase = (Math.sin(this.time * 0.5) + 1) / 2; // 0-1 oscillating

    for (const p of this.particles) {
      // Phase 1: Curl noise flow (organic)
      const curl = curlNoise(p.pos.x, p.pos.y, this.time, 0.003);

      // Phase 2: Attract to center (formation)
      const toCenter = Vector.sub(new Vector(cx, cy), p.pos);
      const dist = toCenter.mag();
      toCenter.normalize();

      // Blend behaviors based on phase
      const curlInfluence = 1 - this.phase * 0.7;
      const attractInfluence = this.phase * 0.3;

      p.vel.x += curl.x * curlInfluence * 0.5;
      p.vel.y += curl.y * curlInfluence * 0.5;

      if (dist > 30) {
        p.vel.x += toCenter.x * attractInfluence * 0.2;
        p.vel.y += toCenter.y * attractInfluence * 0.2;
      }

      // Add subtle rotation around center during attract phase
      if (this.phase > 0.3 && dist < 300) {
        const perpendicular = new Vector(-toCenter.y, toCenter.x);
        p.vel.x += perpendicular.x * this.phase * 0.1;
        p.vel.y += perpendicular.y * this.phase * 0.1;
      }

      p.vel.mult(0.97);
      p.vel.limit(2);
      p.pos.add(p.vel);

      p.life++;

      // Trail
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
        this.ctx.strokeStyle = `hsla(${p.hue}, 70%, 70%, ${alpha})`;
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
      }

      // Reset if out of bounds or dead
      if (p.pos.x < -100 || p.pos.x > w + 100 ||
          p.pos.y < -100 || p.pos.y > h + 100 ||
          p.life > p.maxLife) {
        const newP = this.createParticle();
        p.pos = newP.pos;
        p.vel = newP.vel;
        p.trail = [];
        p.life = 0;
        p.hue = 0 + Math.random() * 15;
      }
    }

    // Central glow during formation phase
    if (this.phase > 0.3) {
      const gradient = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, 150);
      gradient.addColorStop(0, `rgba(248, 113, 113, ${this.phase * 0.1})`);
      gradient.addColorStop(1, 'rgba(248, 113, 113, 0)');
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, w, h);
    }

    // Phase indicator
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.font = '11px monospace';
    const phaseText = this.phase < 0.5 ? 'Flow' : 'Formation';
    this.ctx.fillText(phaseText, 15, 25);
  };
}

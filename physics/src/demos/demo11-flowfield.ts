import { noise } from '../physics/noise';
import { Vector } from '../physics/vector';

interface FlowParticle {
  pos: Vector;
  vel: Vector;
  life: number;
  maxLife: number;
}

export class Demo11FlowField {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: FlowParticle[] = [];
  private flowField: number[][] = [];
  private time: number = 0;
  private animationId: number = 0;
  private showVectors: boolean = true;

  // Controllable parameters
  private resolution: number = 25;
  private noiseScale: number = 0.1;
  private noiseSpeed: number = 0.3;
  private forceStrength: number = 0.2;
  private maxSpeed: number = 2;
  private particleCount: number = 500;
  private trailOpacity: number = 0.1;

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
    this.updateGrid();
  }

  private updateGrid(): void {
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
    // View toggle buttons
    const buttons = document.querySelectorAll('[data-show]');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        buttons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.showVectors = btn.getAttribute('data-show') === 'vectors';
      });
    });

    // Parameter sliders
    this.setupSlider('flow-resolution', (v) => {
      this.resolution = Math.floor(v);
      this.updateValueDisplay('flow-resolution-value', this.resolution.toString());
      this.updateGrid();
    });

    this.setupSlider('flow-noise-scale', (v) => {
      this.noiseScale = v;
      this.updateValueDisplay('flow-noise-scale-value', v.toFixed(2));
    });

    this.setupSlider('flow-noise-speed', (v) => {
      this.noiseSpeed = v;
      this.updateValueDisplay('flow-noise-speed-value', v.toFixed(2));
    });

    this.setupSlider('flow-force-strength', (v) => {
      this.forceStrength = v;
      this.updateValueDisplay('flow-force-strength-value', v.toFixed(2));
    });

    this.setupSlider('flow-max-speed', (v) => {
      this.maxSpeed = v;
      this.updateValueDisplay('flow-max-speed-value', v.toFixed(1));
    });

    this.setupSlider('flow-particle-count', (v) => {
      this.particleCount = Math.floor(v);
      this.updateValueDisplay('flow-particle-count-value', this.particleCount.toString());
      this.resetParticles();
    });

    this.setupSlider('flow-trail-opacity', (v) => {
      this.trailOpacity = v;
      this.updateValueDisplay('flow-trail-opacity-value', v.toFixed(2));
    });
  }

  private setupSlider(id: string, callback: (value: number) => void): void {
    const slider = document.getElementById(id) as HTMLInputElement;
    if (slider) {
      slider.addEventListener('input', (e) => {
        callback(parseFloat((e.target as HTMLInputElement).value));
      });
    }
  }

  private updateValueDisplay(id: string, value: string): void {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  private resetParticles(): void {
    const w = this.canvas.offsetWidth;
    const h = this.canvas.offsetHeight;

    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      const maxLife = 100 + Math.random() * 100;
      this.particles.push({
        pos: new Vector(Math.random() * w, Math.random() * h),
        vel: new Vector(0, 0),
        life: Math.random() * maxLife,
        maxLife,
      });
    }
  }

  start(): void {
    this.resetParticles();
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
        const n = noise.noise3D(
          x * this.noiseScale,
          y * this.noiseScale,
          this.time * this.noiseSpeed,
        );
        this.flowField[idx] = [n * Math.PI * 2];
      }
    }
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);

    const w = this.canvas.offsetWidth;
    const h = this.canvas.offsetHeight;

    // Clear with controllable transparency for trails
    this.ctx.fillStyle = `rgba(10, 10, 15, ${this.trailOpacity})`;
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

          // Color based on angle
          const hue = ((angle + Math.PI) / (Math.PI * 2)) * 30; // Red spectrum
          this.ctx.strokeStyle = `hsla(${hue}, 80%, 60%, 0.2)`;

          this.ctx.beginPath();
          this.ctx.moveTo(px, py);
          this.ctx.lineTo(endX, endY);
          this.ctx.lineWidth = 1;
          this.ctx.stroke();

          // Arrow head
          const headLen = 4;
          this.ctx.beginPath();
          this.ctx.moveTo(endX, endY);
          this.ctx.lineTo(
            endX - headLen * Math.cos(angle - Math.PI / 6),
            endY - headLen * Math.sin(angle - Math.PI / 6),
          );
          this.ctx.moveTo(endX, endY);
          this.ctx.lineTo(
            endX - headLen * Math.cos(angle + Math.PI / 6),
            endY - headLen * Math.sin(angle + Math.PI / 6),
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
      const force = Vector.fromAngle(angle).mult(this.forceStrength);
      p.vel.add(force);
      p.vel.limit(this.maxSpeed);
      p.pos.add(p.vel);

      p.life--;

      // Reset if out of bounds or dead
      if (p.pos.x < 0 || p.pos.x > w || p.pos.y < 0 || p.pos.y > h || p.life <= 0) {
        p.pos = new Vector(Math.random() * w, Math.random() * h);
        p.vel = new Vector(0, 0);
        p.maxLife = 100 + Math.random() * 100;
        p.life = p.maxLife;
      }

      // Draw particle with color based on velocity direction
      const velAngle = p.vel.heading();
      const hue = ((velAngle + Math.PI) / (Math.PI * 2)) * 30;
      const alpha = (p.life / p.maxLife) * 0.8 + 0.2;

      this.ctx.beginPath();
      this.ctx.arc(p.pos.x, p.pos.y, 1.5, 0, Math.PI * 2);
      this.ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${alpha})`;
      this.ctx.fill();
    }

    // Stats
    this.ctx.fillStyle = '#666';
    this.ctx.font = '12px monospace';
    this.ctx.fillText(`particles: ${this.particles.length}`, 15, 25);
    this.ctx.fillText(`grid: ${this.cols}x${this.rows}`, 15, 45);
  };
}

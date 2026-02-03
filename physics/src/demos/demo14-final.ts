import { Vector } from '../physics/vector';
import { VerletParticle, Constraint } from '../physics/particle';
import { curlNoise } from '../physics/noise';

export class Demo14Final {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: VerletParticle[] = [];
  private constraints: Constraint[] = [];
  private time: number = 0;
  private animationId: number = 0;

  // Parameters
  private flowStrength: number = 0.5;
  private springStrength: number = 0.02;
  private gravityStrength: number = 0.1;

  private centerParticle: VerletParticle | null = null;

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
    const flowSlider = document.getElementById('final-flow') as HTMLInputElement;
    const springSlider = document.getElementById('final-spring') as HTMLInputElement;
    const gravitySlider = document.getElementById('final-gravity') as HTMLInputElement;

    if (flowSlider) {
      flowSlider.addEventListener('input', (e) => {
        this.flowStrength = parseFloat((e.target as HTMLInputElement).value);
      });
    }

    if (springSlider) {
      springSlider.addEventListener('input', (e) => {
        this.springStrength = parseFloat((e.target as HTMLInputElement).value);
      });
    }

    if (gravitySlider) {
      gravitySlider.addEventListener('input', (e) => {
        this.gravityStrength = parseFloat((e.target as HTMLInputElement).value);
      });
    }
  }

  start(): void {
    const w = this.canvas.offsetWidth;
    const h = this.canvas.offsetHeight;
    const cx = w / 2;
    const cy = h / 2;

    this.particles = [];
    this.constraints = [];

    // Create a central structure with radiating chains
    this.centerParticle = new VerletParticle(cx, cy, {
      pinned: true,
      radius: 10,
      color: '#fbbf24'
    });
    this.particles.push(this.centerParticle);

    // Create radiating chains
    const chains = 8;
    const chainLength = 12;
    const segmentLength = 20;

    for (let c = 0; c < chains; c++) {
      const angle = (c / chains) * Math.PI * 2;
      let prevParticle = this.centerParticle;

      for (let i = 0; i < chainLength; i++) {
        const distance = segmentLength * (i + 1);
        const x = cx + Math.cos(angle) * distance;
        const y = cy + Math.sin(angle) * distance;

        const particle = new VerletParticle(x, y, {
          radius: 3 + (chainLength - i) * 0.3,
          color: `rgba(248, 113, 113, ${0.5 + (chainLength - i) / chainLength * 0.5})`
        });

        this.particles.push(particle);

        // Create constraint to previous particle
        this.constraints.push(new Constraint(
          prevParticle,
          particle,
          segmentLength,
          0.8
        ));

        prevParticle = particle;
      }
    }

    // Add some free-floating particles
    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 100 + Math.random() * 200;
      this.particles.push(new VerletParticle(
        cx + Math.cos(angle) * dist,
        cy + Math.sin(angle) * dist,
        {
          radius: 2,
          color: 'rgba(248, 113, 113, 0.6)'
        }
      ));
    }

    this.animate();
  }

  stop(): void {
    cancelAnimationFrame(this.animationId);
    this.particles = [];
    this.constraints = [];
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);

    const w = this.canvas.offsetWidth;
    const h = this.canvas.offsetHeight;
    const cx = w / 2;
    const cy = h / 2;

    this.ctx.fillStyle = 'rgba(10, 10, 15, 0.15)';
    this.ctx.fillRect(0, 0, w, h);

    this.time += 0.01;

    // Move center slowly
    if (this.centerParticle) {
      this.centerParticle.pos.x = cx + Math.sin(this.time * 0.3) * 50;
      this.centerParticle.pos.y = cy + Math.cos(this.time * 0.2) * 30;
    }

    // Apply forces to all particles
    for (const p of this.particles) {
      if (p.pinned) continue;

      // Gravity
      p.applyForce(new Vector(0, this.gravityStrength));

      // Curl noise flow
      const curl = curlNoise(p.pos.x, p.pos.y, this.time, 0.005);
      p.applyForce(new Vector(curl.x * this.flowStrength, curl.y * this.flowStrength));

      // Spring force towards center (gentle)
      const toCenter = Vector.sub(new Vector(cx, cy), p.pos);
      const dist = toCenter.mag();
      if (dist > 50) {
        toCenter.normalize().mult(this.springStrength * (dist - 50) * 0.01);
        p.applyForce(toCenter);
      }
    }

    // Update particles with Verlet
    for (const p of this.particles) {
      p.update(0.98);
    }

    // Solve constraints
    for (let iter = 0; iter < 3; iter++) {
      for (const c of this.constraints) {
        c.solve();
      }
    }

    // Keep in bounds
    for (const p of this.particles) {
      if (p.pinned) continue;
      if (p.pos.x < 20) p.pos.x = 20;
      if (p.pos.x > w - 20) p.pos.x = w - 20;
      if (p.pos.y < 20) p.pos.y = 20;
      if (p.pos.y > h - 20) p.pos.y = h - 20;
    }

    // Draw constraints
    for (const c of this.constraints) {
      this.ctx.beginPath();
      this.ctx.moveTo(c.p1.pos.x, c.p1.pos.y);
      this.ctx.lineTo(c.p2.pos.x, c.p2.pos.y);
      this.ctx.strokeStyle = 'rgba(248, 113, 113, 0.3)';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    }

    // Draw particles
    for (const p of this.particles) {
      this.ctx.beginPath();
      this.ctx.arc(p.pos.x, p.pos.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.fill();
    }

    // Parameters display
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.font = '11px monospace';
    this.ctx.fillText(`flow: ${this.flowStrength.toFixed(1)}`, 15, 25);
    this.ctx.fillText(`spring: ${this.springStrength.toFixed(3)}`, 15, 40);
    this.ctx.fillText(`gravity: ${this.gravityStrength.toFixed(2)}`, 15, 55);
  };
}

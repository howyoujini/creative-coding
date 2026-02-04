import { Constraint, VerletParticle } from '../physics/particle';
import { Vector } from '../physics/vector';

export class Demo09Constraint {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: VerletParticle[] = [];
  private constraints: Constraint[] = [];
  private mouse: Vector;
  private draggedParticle: VerletParticle | null = null;
  private animationId: number = 0;
  private constraintEnabled: boolean = true;

  // Controllable parameters
  private gravity: number = 0.3;
  private friction: number = 0.99;
  private stiffness: number = 1.0;
  private iterations: number = 3;
  private cols: number = 12;
  private rows: number = 8;

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
    // Toggle buttons
    const buttons = document.querySelectorAll('[data-constraint]');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        buttons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.constraintEnabled = btn.getAttribute('data-constraint') === 'on';
      });
    });

    // Parameter sliders
    this.setupSlider('constraint-gravity', (v) => {
      this.gravity = v;
      this.updateValueDisplay('constraint-gravity-value', v.toFixed(2));
    });

    this.setupSlider('constraint-friction', (v) => {
      this.friction = v;
      this.updateValueDisplay('constraint-friction-value', v.toFixed(3));
    });

    this.setupSlider('constraint-stiffness', (v) => {
      this.stiffness = v;
      this.updateValueDisplay('constraint-stiffness-value', v.toFixed(2));
      // Update all constraint stiffness
      for (const c of this.constraints) {
        c.stiffness = v;
      }
    });

    this.setupSlider('constraint-iterations', (v) => {
      this.iterations = Math.floor(v);
      this.updateValueDisplay('constraint-iterations-value', this.iterations.toString());
    });

    this.setupSlider('constraint-cols', (v) => {
      this.cols = Math.floor(v);
      this.updateValueDisplay('constraint-cols-value', this.cols.toString());
      this.rebuildCloth();
    });

    this.setupSlider('constraint-rows', (v) => {
      this.rows = Math.floor(v);
      this.updateValueDisplay('constraint-rows-value', this.rows.toString());
      this.rebuildCloth();
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

  private setupMouse(): void {
    this.canvas.addEventListener('mousedown', (e) => {
      this.updateMouse(e);
      this.draggedParticle = this.findNearestParticle();
    });

    this.canvas.addEventListener('mousemove', (e) => {
      this.updateMouse(e);
      if (this.draggedParticle && !this.draggedParticle.pinned) {
        this.draggedParticle.pos = this.mouse.copy();
        this.draggedParticle.oldPos = this.mouse.copy();
      }
    });

    this.canvas.addEventListener('mouseup', () => {
      this.draggedParticle = null;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.draggedParticle = null;
    });
  }

  private updateMouse(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = e.clientX - rect.left;
    this.mouse.y = e.clientY - rect.top;
  }

  private findNearestParticle(): VerletParticle | null {
    let nearest: VerletParticle | null = null;
    let minDist = 30;

    for (const p of this.particles) {
      const d = Vector.dist(this.mouse, p.pos);
      if (d < minDist) {
        minDist = d;
        nearest = p;
      }
    }

    return nearest;
  }

  private rebuildCloth(): void {
    const w = this.canvas.offsetWidth;

    this.particles = [];
    this.constraints = [];

    // Calculate spacing based on grid size
    const maxWidth = w * 0.8;
    const spacing = Math.min(30, maxWidth / (this.cols - 1));
    const startX = (w - (this.cols - 1) * spacing) / 2;
    const startY = 80;

    // Create particles
    for (let j = 0; j < this.rows; j++) {
      for (let i = 0; i < this.cols; i++) {
        const x = startX + i * spacing;
        const y = startY + j * spacing;
        // Pin top row at regular intervals
        const pinInterval = Math.max(1, Math.floor(this.cols / 4));
        const pinned = j === 0 && (i % pinInterval === 0 || i === this.cols - 1);

        this.particles.push(
          new VerletParticle(x, y, {
            pinned,
            radius: pinned ? 6 : 4,
            color: '#f87171',
          }),
        );
      }
    }

    // Create constraints (horizontal and vertical)
    for (let j = 0; j < this.rows; j++) {
      for (let i = 0; i < this.cols; i++) {
        const idx = j * this.cols + i;

        // Horizontal
        if (i < this.cols - 1) {
          this.constraints.push(
            new Constraint(this.particles[idx], this.particles[idx + 1], spacing, this.stiffness),
          );
        }

        // Vertical
        if (j < this.rows - 1) {
          this.constraints.push(
            new Constraint(
              this.particles[idx],
              this.particles[idx + this.cols],
              spacing,
              this.stiffness,
            ),
          );
        }
      }
    }
  }

  start(): void {
    this.rebuildCloth();
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

    this.ctx.fillStyle = 'rgba(10, 10, 15, 0.3)';
    this.ctx.fillRect(0, 0, w, h);

    // Apply gravity
    const gravityForce = new Vector(0, this.gravity);
    for (const p of this.particles) {
      p.applyForce(gravityForce);
    }

    // Update particles
    for (const p of this.particles) {
      p.update(this.friction);
    }

    // Solve constraints multiple times for stability
    if (this.constraintEnabled) {
      for (let iter = 0; iter < this.iterations; iter++) {
        for (const c of this.constraints) {
          c.solve();
        }
      }
    }

    // Keep particles in bounds
    for (const p of this.particles) {
      if (p.pos.x < 10) p.pos.x = 10;
      if (p.pos.x > w - 10) p.pos.x = w - 10;
      if (p.pos.y < 10) p.pos.y = 10;
      if (p.pos.y > h - 10) p.pos.y = h - 10;
    }

    // Draw constraints
    for (const c of this.constraints) {
      this.ctx.beginPath();
      this.ctx.moveTo(c.p1.pos.x, c.p1.pos.y);
      this.ctx.lineTo(c.p2.pos.x, c.p2.pos.y);

      if (this.constraintEnabled) {
        // Show tension based on stretch
        const currentLength = Vector.dist(c.p1.pos, c.p2.pos);
        const stretch = Math.abs(currentLength - c.length) / c.length;
        const tension = Math.min(stretch * 5, 1);
        this.ctx.strokeStyle = `rgba(${248 + 7 * tension}, ${113 - 113 * tension + 204 * tension}, ${113 - 113 * tension + 21 * tension}, ${0.4 + tension * 0.4})`;
      } else {
        // Show stretching when constraints off
        const stretch = Math.abs(Vector.dist(c.p1.pos, c.p2.pos) - c.length);
        const stretchColor = Math.min(stretch / 50, 1);
        this.ctx.strokeStyle = `rgba(${255 * stretchColor}, ${231 * (1 - stretchColor)}, ${183 * (1 - stretchColor)}, 0.4)`;
      }

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

    // Status
    this.ctx.fillStyle = '#666';
    this.ctx.font = '12px monospace';
    this.ctx.fillText(`constraint: ${this.constraintEnabled ? 'ON' : 'OFF'}`, 15, 25);
    this.ctx.fillText(`iterations: ${this.iterations}`, 15, 45);
    this.ctx.fillText(`stiffness: ${this.stiffness.toFixed(2)}`, 15, 65);
    this.ctx.fillText(`grid: ${this.cols}x${this.rows}`, 15, 85);
    this.ctx.fillText('drag particles to interact', 15, h - 15);
  };
}

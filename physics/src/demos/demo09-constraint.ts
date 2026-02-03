import { Vector } from '../physics/vector';
import { VerletParticle, Constraint } from '../physics/particle';

export class Demo09Constraint {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: VerletParticle[] = [];
  private constraints: Constraint[] = [];
  private mouse: Vector;
  private draggedParticle: VerletParticle | null = null;
  private animationId: number = 0;
  private constraintEnabled: boolean = true;

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
    const buttons = document.querySelectorAll('[data-constraint]');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.constraintEnabled = btn.getAttribute('data-constraint') === 'on';
      });
    });
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

  start(): void {
    const w = this.canvas.offsetWidth;

    this.particles = [];
    this.constraints = [];

    // Create a cloth-like structure
    const cols = 12;
    const rows = 8;
    const spacing = 30;
    const startX = (w - (cols - 1) * spacing) / 2;
    const startY = 80;

    // Create particles
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const x = startX + i * spacing;
        const y = startY + j * spacing;
        const pinned = j === 0 && (i === 0 || i === Math.floor(cols / 2) || i === cols - 1);

        this.particles.push(new VerletParticle(x, y, {
          pinned,
          radius: pinned ? 6 : 4,
          color: pinned ? '#fbbf24' : '#f87171'
        }));
      }
    }

    // Create constraints (horizontal and vertical)
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const idx = j * cols + i;

        // Horizontal
        if (i < cols - 1) {
          this.constraints.push(new Constraint(
            this.particles[idx],
            this.particles[idx + 1],
            spacing
          ));
        }

        // Vertical
        if (j < rows - 1) {
          this.constraints.push(new Constraint(
            this.particles[idx],
            this.particles[idx + cols],
            spacing
          ));
        }
      }
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

    this.ctx.fillStyle = 'rgba(10, 10, 15, 0.3)';
    this.ctx.fillRect(0, 0, w, h);

    // Apply gravity
    const gravity = new Vector(0, 0.3);
    for (const p of this.particles) {
      p.applyForce(gravity);
    }

    // Update particles
    for (const p of this.particles) {
      p.update(0.99);
    }

    // Solve constraints multiple times for stability
    if (this.constraintEnabled) {
      for (let iter = 0; iter < 3; iter++) {
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
        this.ctx.strokeStyle = 'rgba(248, 113, 113, 0.4)';
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
    this.ctx.fillText('drag particles to interact', 15, h - 15);
  };
}

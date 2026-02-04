import { Vector } from '../physics/vector';

interface IntegrationParticle {
  pos: Vector;
  vel: Vector;
  oldPos: Vector;
  acc: Vector;
  trail: Vector[];
}

export class Demo07Integration {
  private canvasEuler: HTMLCanvasElement;
  private canvasVerlet: HTMLCanvasElement;
  private ctxEuler: CanvasRenderingContext2D;
  private ctxVerlet: CanvasRenderingContext2D;
  private eulerParticle: IntegrationParticle;
  private verletParticle: IntegrationParticle;
  private animationId: number = 0;
  private mouseEuler: Vector;
  private mouseVerlet: Vector;

  constructor(eulerId: string, verletId: string) {
    this.canvasEuler = document.getElementById(eulerId) as HTMLCanvasElement;
    this.canvasVerlet = document.getElementById(verletId) as HTMLCanvasElement;
    this.ctxEuler = this.canvasEuler.getContext('2d')!;
    this.ctxVerlet = this.canvasVerlet.getContext('2d')!;

    this.eulerParticle = this.createParticle();
    this.verletParticle = this.createParticle();
    this.mouseEuler = new Vector(0, 0);
    this.mouseVerlet = new Vector(0, 0);

    this.resize();
    this.setupMouse();
  }

  private createParticle(): IntegrationParticle {
    return {
      pos: new Vector(0, 0),
      vel: new Vector(0, 0),
      oldPos: new Vector(0, 0),
      acc: new Vector(0, 0),
      trail: [],
    };
  }

  private resize(): void {
    [this.canvasEuler, this.canvasVerlet].forEach((canvas) => {
      const parent = canvas.parentElement!;
      const w = parent.offsetWidth;
      const h = parent.offsetHeight;
      const dpr = window.devicePixelRatio;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    });

    const w = this.canvasEuler.parentElement?.offsetWidth;
    const h = this.canvasEuler.parentElement?.offsetHeight;

    this.eulerParticle.pos = new Vector(w / 2, h / 2);
    this.eulerParticle.oldPos = this.eulerParticle.pos.copy();
    this.verletParticle.pos = new Vector(w / 2, h / 2);
    this.verletParticle.oldPos = this.verletParticle.pos.copy();

    this.mouseEuler = new Vector(w / 2, h / 2);
    this.mouseVerlet = new Vector(w / 2, h / 2);
  }

  private setupMouse(): void {
    this.canvasEuler.addEventListener('mousemove', (e) => {
      const rect = this.canvasEuler.getBoundingClientRect();
      this.mouseEuler.x = e.clientX - rect.left;
      this.mouseEuler.y = e.clientY - rect.top;
    });

    this.canvasVerlet.addEventListener('mousemove', (e) => {
      const rect = this.canvasVerlet.getBoundingClientRect();
      this.mouseVerlet.x = e.clientX - rect.left;
      this.mouseVerlet.y = e.clientY - rect.top;
    });
  }

  start(): void {
    this.animate();
  }

  stop(): void {
    cancelAnimationFrame(this.animationId);
    this.eulerParticle.trail = [];
    this.verletParticle.trail = [];
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);

    const parent = this.canvasEuler.parentElement!;
    const w = parent.offsetWidth;
    const h = parent.offsetHeight;

    this.time += 0.016;

    // Update Euler
    this.updateEuler(w, h);

    // Update Verlet
    this.updateVerlet(w, h);

    // Draw both
    this.draw(this.ctxEuler, this.eulerParticle, w, h, this.mouseEuler);
    this.draw(this.ctxVerlet, this.verletParticle, w, h, this.mouseVerlet);
  };

  private updateEuler(w: number, h: number): void {
    const p = this.eulerParticle;

    // Force towards mouse
    const force = Vector.sub(this.mouseEuler, p.pos);
    force.normalize();
    force.mult(0.5); // Strong force - shows instability

    p.acc = force;
    p.vel.add(p.acc);
    p.vel.mult(0.95);
    p.pos.add(p.vel);

    // Trail
    p.trail.push(p.pos.copy());
    if (p.trail.length > 50) p.trail.shift();

    // Bounds
    this.constrainToBounds(p, w, h);
  }

  private updateVerlet(w: number, h: number): void {
    const p = this.verletParticle;

    // Force towards mouse
    const force = Vector.sub(this.mouseVerlet, p.pos);
    force.normalize();
    force.mult(0.5);

    p.acc = force;

    // Verlet integration
    const vel = Vector.sub(p.pos, p.oldPos);
    vel.mult(0.95); // Friction

    p.oldPos = p.pos.copy();
    p.pos.add(vel);
    p.pos.add(p.acc);

    // Trail
    p.trail.push(p.pos.copy());
    if (p.trail.length > 50) p.trail.shift();

    // Bounds
    this.constrainToBounds(p, w, h);
  }

  private constrainToBounds(p: IntegrationParticle, w: number, h: number): void {
    const margin = 20;
    if (p.pos.x < margin) {
      p.pos.x = margin;
      p.vel.x *= -0.5;
      p.oldPos.x = p.pos.x + p.vel.x;
    }
    if (p.pos.x > w - margin) {
      p.pos.x = w - margin;
      p.vel.x *= -0.5;
      p.oldPos.x = p.pos.x + p.vel.x;
    }
    if (p.pos.y < margin) {
      p.pos.y = margin;
      p.vel.y *= -0.5;
      p.oldPos.y = p.pos.y + p.vel.y;
    }
    if (p.pos.y > h - margin) {
      p.pos.y = h - margin;
      p.vel.y *= -0.5;
      p.oldPos.y = p.pos.y + p.vel.y;
    }
  }

  private draw(
    ctx: CanvasRenderingContext2D,
    p: IntegrationParticle,
    w: number,
    h: number,
    mouse: Vector,
  ): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, w, h);

    // Draw trail
    if (p.trail.length > 1) {
      ctx.beginPath();
      ctx.moveTo(p.trail[0].x, p.trail[0].y);
      for (let i = 1; i < p.trail.length; i++) {
        ctx.lineTo(p.trail[i].x, p.trail[i].y);
      }
      ctx.strokeStyle = 'rgba(248, 113, 113, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw target
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, 15, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(248, 113, 113, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw particle
    ctx.beginPath();
    ctx.arc(p.pos.x, p.pos.y, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#f87171';
    ctx.fill();

    // Draw velocity indicator
    const velDisplay = Vector.mult(p.vel, 10);
    ctx.beginPath();
    ctx.moveTo(p.pos.x, p.pos.y);
    ctx.lineTo(p.pos.x + velDisplay.x, p.pos.y + velDisplay.y);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

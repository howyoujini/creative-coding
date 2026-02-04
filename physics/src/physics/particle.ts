import { Vector } from './vector';

export class Particle {
  pos: Vector;
  vel: Vector;
  acc: Vector;
  prevPos: Vector;
  mass: number;
  radius: number;
  life: number;
  maxLife: number;
  color: string;

  constructor(
    x: number,
    y: number,
    options: Partial<{
      vx: number;
      vy: number;
      mass: number;
      radius: number;
      life: number;
      color: string;
    }> = {},
  ) {
    this.pos = new Vector(x, y);
    this.vel = new Vector(options.vx || 0, options.vy || 0);
    this.acc = new Vector(0, 0);
    this.prevPos = new Vector(x, y);
    this.mass = options.mass || 1;
    this.radius = options.radius || 4;
    this.maxLife = options.life || Infinity;
    this.life = this.maxLife;
    this.color = options.color || '#f87171';
  }

  applyForce(force: Vector): void {
    const f = Vector.mult(force, 1 / this.mass);
    this.acc.add(f);
  }

  updateEuler(dt: number = 1): void {
    this.vel.add(this.acc);
    this.pos.add(Vector.mult(this.vel, dt));
    this.acc.mult(0);
    this.life--;
  }

  updateVerlet(dt: number = 1): void {
    const velocity = Vector.sub(this.pos, this.prevPos);
    this.prevPos = this.pos.copy();

    this.pos.add(velocity);
    this.pos.add(Vector.mult(this.acc, dt * dt));
    this.acc.mult(0);
    this.life--;
  }

  edges(width: number, height: number, bounce: boolean = true): void {
    if (bounce) {
      if (this.pos.x < this.radius) {
        this.pos.x = this.radius;
        this.vel.x *= -0.8;
        this.prevPos.x = this.pos.x + this.vel.x;
      }
      if (this.pos.x > width - this.radius) {
        this.pos.x = width - this.radius;
        this.vel.x *= -0.8;
        this.prevPos.x = this.pos.x + this.vel.x;
      }
      if (this.pos.y < this.radius) {
        this.pos.y = this.radius;
        this.vel.y *= -0.8;
        this.prevPos.y = this.pos.y + this.vel.y;
      }
      if (this.pos.y > height - this.radius) {
        this.pos.y = height - this.radius;
        this.vel.y *= -0.8;
        this.prevPos.y = this.pos.y + this.vel.y;
      }
    } else {
      if (this.pos.x < 0) this.pos.x = width;
      if (this.pos.x > width) this.pos.x = 0;
      if (this.pos.y < 0) this.pos.y = height;
      if (this.pos.y > height) this.pos.y = 0;
    }
  }

  isDead(): boolean {
    return this.life <= 0;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

export class VerletParticle {
  pos: Vector;
  oldPos: Vector;
  acc: Vector;
  pinned: boolean;
  mass: number;
  radius: number;
  color: string;

  constructor(
    x: number,
    y: number,
    options: Partial<{
      pinned: boolean;
      mass: number;
      radius: number;
      color: string;
    }> = {},
  ) {
    this.pos = new Vector(x, y);
    this.oldPos = new Vector(x, y);
    this.acc = new Vector(0, 0);
    this.pinned = options.pinned || false;
    this.mass = options.mass || 1;
    this.radius = options.radius || 4;
    this.color = options.color || '#f87171';
  }

  applyForce(force: Vector): void {
    if (this.pinned) return;
    const f = Vector.mult(force, 1 / this.mass);
    this.acc.add(f);
  }

  update(friction: number = 0.99): void {
    if (this.pinned) return;

    const vel = Vector.sub(this.pos, this.oldPos).mult(friction);
    this.oldPos = this.pos.copy();
    this.pos.add(vel);
    this.pos.add(this.acc);
    this.acc.mult(0);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

export class Constraint {
  p1: VerletParticle;
  p2: VerletParticle;
  length: number;
  stiffness: number;

  constructor(p1: VerletParticle, p2: VerletParticle, length?: number, stiffness: number = 1) {
    this.p1 = p1;
    this.p2 = p2;
    this.length = length || Vector.dist(p1.pos, p2.pos);
    this.stiffness = stiffness;
  }

  solve(): void {
    const diff = Vector.sub(this.p2.pos, this.p1.pos);
    const dist = diff.mag();
    const diffFactor = ((this.length - dist) / dist) * this.stiffness;
    const offset = Vector.mult(diff, diffFactor * 0.5);

    if (!this.p1.pinned) {
      this.p1.pos.sub(offset);
    }
    if (!this.p2.pinned) {
      this.p2.pos.add(offset);
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.moveTo(this.p1.pos.x, this.p1.pos.y);
    ctx.lineTo(this.p2.pos.x, this.p2.pos.y);
    ctx.strokeStyle = 'rgba(248, 113, 113, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

export class Spring {
  anchor: Vector;
  particle: Particle;
  restLength: number;
  k: number;

  constructor(anchor: Vector, particle: Particle, restLength: number, k: number = 0.1) {
    this.anchor = anchor;
    this.particle = particle;
    this.restLength = restLength;
    this.k = k;
  }

  update(): void {
    const force = Vector.sub(this.anchor, this.particle.pos);
    const d = force.mag();
    const stretch = d - this.restLength;

    force.normalize();
    force.mult(this.k * stretch);
    this.particle.applyForce(force);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.moveTo(this.anchor.x, this.anchor.y);
    ctx.lineTo(this.particle.pos.x, this.particle.pos.y);
    ctx.strokeStyle = 'rgba(248, 113, 113, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(this.anchor.x, this.anchor.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#f87171';
    ctx.fill();
  }
}

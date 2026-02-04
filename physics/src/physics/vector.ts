export class Vector {
  constructor(
    public x: number = 0,
    public y: number = 0,
  ) {}

  static create(x: number, y: number): Vector {
    return new Vector(x, y);
  }

  static random(): Vector {
    const angle = Math.random() * Math.PI * 2;
    return new Vector(Math.cos(angle), Math.sin(angle));
  }

  static fromAngle(angle: number): Vector {
    return new Vector(Math.cos(angle), Math.sin(angle));
  }

  copy(): Vector {
    return new Vector(this.x, this.y);
  }

  add(v: Vector): Vector {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  sub(v: Vector): Vector {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  mult(n: number): Vector {
    this.x *= n;
    this.y *= n;
    return this;
  }

  div(n: number): Vector {
    if (n !== 0) {
      this.x /= n;
      this.y /= n;
    }
    return this;
  }

  mag(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  magSq(): number {
    return this.x * this.x + this.y * this.y;
  }

  normalize(): Vector {
    const m = this.mag();
    if (m > 0) {
      this.div(m);
    }
    return this;
  }

  limit(max: number): Vector {
    const mSq = this.magSq();
    if (mSq > max * max) {
      this.div(Math.sqrt(mSq)).mult(max);
    }
    return this;
  }

  setMag(len: number): Vector {
    return this.normalize().mult(len);
  }

  heading(): number {
    return Math.atan2(this.y, this.x);
  }

  rotate(angle: number): Vector {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const x = this.x * cos - this.y * sin;
    const y = this.x * sin + this.y * cos;
    this.x = x;
    this.y = y;
    return this;
  }

  dist(v: Vector): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  lerp(v: Vector, t: number): Vector {
    this.x += (v.x - this.x) * t;
    this.y += (v.y - this.y) * t;
    return this;
  }

  static sub(v1: Vector, v2: Vector): Vector {
    return new Vector(v1.x - v2.x, v1.y - v2.y);
  }

  static add(v1: Vector, v2: Vector): Vector {
    return new Vector(v1.x + v2.x, v1.y + v2.y);
  }

  static mult(v: Vector, n: number): Vector {
    return new Vector(v.x * n, v.y * n);
  }

  static dist(v1: Vector, v2: Vector): number {
    return v1.dist(v2);
  }

  static lerp(v1: Vector, v2: Vector, t: number): Vector {
    return new Vector(v1.x + (v2.x - v1.x) * t, v1.y + (v2.y - v1.y) * t);
  }
}

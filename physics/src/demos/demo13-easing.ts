import { Vector } from '../physics/vector';

interface EasingDot {
  pos: Vector;
  startX: number;
  endX: number;
  progress: number;
  delay: number;
}

// Easing functions
function linear(t: number): number {
  return t;
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

// Additional easing functions (for future use)
// function easeOutElastic(t: number): number {
//   const c4 = (2 * Math.PI) / 3;
//   return t === 0 ? 0 : t === 1 ? 1 :
//     Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
// }
// function easeInOutCubic(t: number): number {
//   return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
// }

export class Demo13Easing {
  private canvasLinear: HTMLCanvasElement;
  private canvasSmooth: HTMLCanvasElement;
  private ctxLinear: CanvasRenderingContext2D;
  private ctxSmooth: CanvasRenderingContext2D;
  private dotsLinear: EasingDot[] = [];
  private dotsSmooth: EasingDot[] = [];
  private time: number = 0;
  private animationId: number = 0;

  constructor(linearId: string, smoothId: string) {
    this.canvasLinear = document.getElementById(linearId) as HTMLCanvasElement;
    this.canvasSmooth = document.getElementById(smoothId) as HTMLCanvasElement;
    this.ctxLinear = this.canvasLinear.getContext('2d')!;
    this.ctxSmooth = this.canvasSmooth.getContext('2d')!;
    this.resize();
  }

  private resize(): void {
    [this.canvasLinear, this.canvasSmooth].forEach(canvas => {
      const parent = canvas.parentElement!;
      const w = parent.offsetWidth;
      const h = parent.offsetHeight;
      const dpr = window.devicePixelRatio;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(dpr, dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
    });
  }

  start(): void {
    const parent = this.canvasLinear.parentElement!;
    const w = parent.offsetWidth;
    const h = parent.offsetHeight;

    const rows = 8;
    const margin = 60;
    const spacing = (h - margin * 2) / (rows - 1);

    for (let i = 0; i < rows; i++) {
      const y = margin + i * spacing;
      const dot: EasingDot = {
        pos: new Vector(margin, y),
        startX: margin,
        endX: w - margin,
        progress: 0,
        delay: i * 0.1
      };
      this.dotsLinear.push({ ...dot });
      this.dotsSmooth.push({ ...dot });
    }

    this.animate();
  }

  stop(): void {
    cancelAnimationFrame(this.animationId);
    this.dotsLinear = [];
    this.dotsSmooth = [];
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);

    const parent = this.canvasLinear.parentElement!;
    const w = parent.offsetWidth;
    const h = parent.offsetHeight;

    this.ctxLinear.fillStyle = '#0a0a0f';
    this.ctxLinear.fillRect(0, 0, w, h);
    this.ctxSmooth.fillStyle = '#0a0a0f';
    this.ctxSmooth.fillRect(0, 0, w, h);

    this.time += 0.008;

    // Calculate base progress (loops every 3 seconds)
    const cycleTime = 3;
    const baseProgress = (this.time % cycleTime) / cycleTime;
    const direction = Math.floor(this.time / cycleTime) % 2 === 0 ? 1 : -1;
    const adjustedProgress = direction === 1 ? baseProgress : 1 - baseProgress;

    // Draw path lines
    for (const dot of this.dotsLinear) {
      this.ctxLinear.beginPath();
      this.ctxLinear.moveTo(dot.startX, dot.pos.y);
      this.ctxLinear.lineTo(dot.endX, dot.pos.y);
      this.ctxLinear.strokeStyle = 'rgba(248, 113, 113, 0.1)';
      this.ctxLinear.lineWidth = 1;
      this.ctxLinear.stroke();
    }

    for (const dot of this.dotsSmooth) {
      this.ctxSmooth.beginPath();
      this.ctxSmooth.moveTo(dot.startX, dot.pos.y);
      this.ctxSmooth.lineTo(dot.endX, dot.pos.y);
      this.ctxSmooth.strokeStyle = 'rgba(248, 113, 113, 0.1)';
      this.ctxSmooth.lineWidth = 1;
      this.ctxSmooth.stroke();
    }

    // Update and draw dots
    for (let i = 0; i < this.dotsLinear.length; i++) {
      const dotLinear = this.dotsLinear[i];
      const dotSmooth = this.dotsSmooth[i];

      // Apply delay
      const delayedProgress = Math.max(0, Math.min(1, (adjustedProgress - dotLinear.delay) / (1 - dotLinear.delay * 2)));

      // Linear easing
      const linearEased = linear(delayedProgress);
      dotLinear.pos.x = dotLinear.startX + (dotLinear.endX - dotLinear.startX) * linearEased;

      // Smoothstep easing
      const smoothEased = smoothstep(delayedProgress);
      dotSmooth.pos.x = dotSmooth.startX + (dotSmooth.endX - dotSmooth.startX) * smoothEased;

      // Draw linear dot
      this.ctxLinear.beginPath();
      this.ctxLinear.arc(dotLinear.pos.x, dotLinear.pos.y, 8, 0, Math.PI * 2);
      this.ctxLinear.fillStyle = '#f87171';
      this.ctxLinear.fill();

      // Draw smooth dot
      this.ctxSmooth.beginPath();
      this.ctxSmooth.arc(dotSmooth.pos.x, dotSmooth.pos.y, 8, 0, Math.PI * 2);
      this.ctxSmooth.fillStyle = '#f87171';
      this.ctxSmooth.fill();
    }

    // Draw easing curves
    this.drawEasingCurve(this.ctxLinear, w, h, linear, 'linear(t) = t');
    this.drawEasingCurve(this.ctxSmooth, w, h, smoothstep, 'smoothstep(t)');
  };

  private drawEasingCurve(
    ctx: CanvasRenderingContext2D,
    w: number,
    _h: number,
    easingFn: (t: number) => number,
    label: string
  ): void {
    const curveW = 80;
    const curveH = 60;
    const curveX = w - curveW - 15;
    const curveY = 15;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(curveX, curveY, curveW, curveH);

    // Curve
    ctx.beginPath();
    for (let i = 0; i <= curveW; i++) {
      const t = i / curveW;
      const eased = easingFn(t);
      const x = curveX + i;
      const y = curveY + curveH - eased * curveH;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Label
    ctx.fillStyle = '#666';
    ctx.font = '10px monospace';
    ctx.fillText(label, curveX, curveY + curveH + 15);
  }
}

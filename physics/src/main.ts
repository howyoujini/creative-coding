import { Demo01Title } from './demos/demo01-title';
import { Demo02Random } from './demos/demo02-random';
import { Demo03Rules } from './demos/demo03-rules';
import { Demo04Map } from './demos/demo04-map';
import { Demo05Particle } from './demos/demo05-particle';
import { Demo06Force } from './demos/demo06-force';
import { Demo07Integration } from './demos/demo07-integration';
import { Demo08Spring } from './demos/demo08-spring';
import { Demo09Constraint } from './demos/demo09-constraint';
import { Demo10Transition } from './demos/demo10-transition';
import { Demo11FlowField } from './demos/demo11-flowfield';
import { Demo12CurlNoise } from './demos/demo12-curlnoise';
import { Demo13Easing } from './demos/demo13-easing';
import { Demo14Final } from './demos/demo14-final';
import { Demo15Closing } from './demos/demo15-closing';

interface Demo {
  start: () => void;
  stop: () => void;
}

class Presentation {
  private currentSlide: number = 1;
  private totalSlides: number = 16;
  private demos: Map<number, Demo> = new Map();
  private initializedDemos: Set<number> = new Set();

  constructor() {
    this.setupNavigation();
    this.setupKeyboardNavigation();
    this.updateProgress();
    this.initializeDemo(1);
  }

  private setupNavigation(): void {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const scrollbarToggle = document.getElementById('scrollbar-toggle');
    const themeToggle = document.getElementById('theme-toggle');

    prevBtn?.addEventListener('click', () => this.goToSlide(this.currentSlide - 1));
    nextBtn?.addEventListener('click', () => this.goToSlide(this.currentSlide + 1));

    scrollbarToggle?.addEventListener('click', () => {
      document.body.classList.toggle('show-scrollbar');
      scrollbarToggle.classList.toggle('active');
    });

    themeToggle?.addEventListener('click', () => {
      const isLight = document.body.classList.toggle('light-mode');
      themeToggle.textContent = isLight ? '🌙' : '☀️';
      themeToggle.classList.toggle('active');
    });
  }

  private setupKeyboardNavigation(): void {
    document.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
        case 'PageDown':
          e.preventDefault();
          this.goToSlide(this.currentSlide + 1);
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          this.goToSlide(this.currentSlide - 1);
          break;
        case 'Home':
          e.preventDefault();
          this.goToSlide(1);
          break;
        case 'End':
          e.preventDefault();
          this.goToSlide(this.totalSlides);
          break;
      }
    });
  }

  private goToSlide(slideNumber: number): void {
    if (slideNumber < 1 || slideNumber > this.totalSlides) return;
    if (slideNumber === this.currentSlide) return;

    // Stop current demo
    const currentDemo = this.demos.get(this.currentSlide);
    currentDemo?.stop();

    // Update slide visibility
    const slides = document.querySelectorAll('.slide');
    slides.forEach((slide, index) => {
      if (index + 1 === slideNumber) {
        slide.classList.add('active');
      } else {
        slide.classList.remove('active');
      }
    });

    this.currentSlide = slideNumber;
    this.updateProgress();
    this.initializeDemo(slideNumber);
  }

  private updateProgress(): void {
    const progress = document.getElementById('progress');
    const currentSlideEl = document.getElementById('current-slide');

    if (progress) {
      progress.style.width = `${(this.currentSlide / this.totalSlides) * 100}%`;
    }

    if (currentSlideEl) {
      currentSlideEl.textContent = this.currentSlide.toString().padStart(2, '0');
    }
  }

  private initializeDemo(slideNumber: number): void {
    // Create demo if not already created
    if (!this.initializedDemos.has(slideNumber)) {
      this.createDemo(slideNumber);
      this.initializedDemos.add(slideNumber);
    }

    // Start the demo
    const demo = this.demos.get(slideNumber);
    demo?.start();
  }

  private createDemo(slideNumber: number): void {
    let demo: Demo | null = null;

    switch (slideNumber) {
      case 1:
        demo = new Demo01Title('canvas-01');
        break;
      case 2:
        demo = new Demo02Random('canvas-02-left', 'canvas-02-right');
        break;
      case 3:
        demo = new Demo03Rules('canvas-03');
        break;
      case 4:
        demo = new Demo04Map('canvas-04');
        break;
      case 5:
        demo = new Demo05Particle('canvas-05');
        break;
      case 6:
        demo = new Demo06Force('canvas-06');
        break;
      case 7:
        demo = new Demo07Integration('canvas-07-euler', 'canvas-07-verlet');
        break;
      case 8:
        demo = new Demo08Spring('canvas-08');
        break;
      case 9:
        demo = new Demo09Constraint('canvas-09');
        break;
      case 10:
        demo = new Demo10Transition('canvas-10');
        break;
      case 11:
        demo = new Demo11FlowField('canvas-11');
        break;
      case 12:
        demo = new Demo12CurlNoise('canvas-12');
        break;
      case 13:
        demo = new Demo13Easing('canvas-13-linear', 'canvas-13-smooth');
        break;
      case 14:
        demo = new Demo14Final('canvas-14');
        break;
      case 15:
        demo = new Demo15Closing('canvas-15');
        break;
    }

    if (demo) {
      this.demos.set(slideNumber, demo);
    }
  }
}

// Initialize presentation when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new Presentation();
});

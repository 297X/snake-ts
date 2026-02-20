import { Snake } from "./snake.js";
import { Food } from "./food.js";
import { Renderer } from "./renderer.js";
import { ParticleSystem } from "./particles.js";
import { Direction, GameConfig, GameState, Snapshot } from "./types.js";

const FOOD_PARTICLE_COLORS = ["#ff004d", "#ffa300", "#ffec27", "#fff1e8", "#ff77a8"];

const REWIND_SPEED = 4;

export class Game {
  private snake: Snake;
  private food: Food;
  private renderer: Renderer;
  private particles: ParticleSystem;
  private config: GameConfig;

  private state: GameState = "idle";
  private score: number = 0;
  private bestScore: number = 0;
  private lastTime: number = 0;
  private accumulator: number = 0;
  private pulse: number = 0;
  private shakeAmount: number = 0;

  private snapshots: Snapshot[] = [];
  private rewindIndex: number = 0;
  private keysHeld: Set<string> = new Set();

  constructor(canvas: HTMLCanvasElement, config: GameConfig) {
    this.config = config;
    this.renderer = new Renderer(canvas, config);
    this.particles = new ParticleSystem();

    const startX = Math.floor(config.cols / 2);
    const startY = Math.floor(config.rows / 2);
    this.snake = new Snake(startX, startY);
    this.food = new Food(config.cols, config.rows, this.snake.getBody());

    this.bestScore = parseInt(localStorage.getItem("snake-best") ?? "0", 10);

    this.bindInput(canvas);
    requestAnimationFrame(this.loop);
  }

  private bindInput(canvas: HTMLCanvasElement): void {
    const keyMap: Record<string, Direction> = {
      ArrowUp: "UP", ArrowDown: "DOWN", ArrowLeft: "LEFT", ArrowRight: "RIGHT",
      w: "UP", s: "DOWN", a: "LEFT", d: "RIGHT",
      W: "UP", S: "DOWN", A: "LEFT", D: "RIGHT",
    };

    window.addEventListener("keydown", (e) => {
      this.keysHeld.add(e.key);

      if (this.state === "rewind") {
        if (e.key === " ") { e.preventDefault(); this.resumeFromRewind(); return; }
        if (e.key === "Escape") { this.fullRestart(); return; }
        if (e.key === "a" || e.key === "A" || e.key === "d" || e.key === "D") {
          e.preventDefault();
        }
        return;
      }

      if (e.key === " ") { e.preventDefault(); this.handleAction(); return; }
      if (e.key === "p" || e.key === "P") { this.togglePause(); return; }
      const dir = keyMap[e.key];
      if (dir) {
        e.preventDefault();
        this.snake.setDirection(dir);
        if (this.state === "idle") this.start();
      }
    });

    window.addEventListener("keyup", (e) => {
      this.keysHeld.delete(e.key);
    });

    let touchStartX = 0;
    let touchStartY = 0;

    canvas.addEventListener("touchstart", (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      e.preventDefault();
    }, { passive: false });

    canvas.addEventListener("touchend", (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) { this.handleAction(); return; }
      if (Math.abs(dx) > Math.abs(dy)) {
        this.snake.setDirection(dx > 0 ? "RIGHT" : "LEFT");
      } else {
        this.snake.setDirection(dy > 0 ? "DOWN" : "UP");
      }
      if (this.state === "idle") this.start();
      e.preventDefault();
    }, { passive: false });
  }

  private handleAction(): void {
    if (this.state === "idle" || this.state === "gameover") {
      this.start();
    } else if (this.state === "running" || this.state === "paused") {
      this.togglePause();
    }
  }

  private togglePause(): void {
    if (this.state === "running") {
      this.state = "paused";
    } else if (this.state === "paused") {
      this.state = "running";
      this.lastTime = performance.now();
    }
  }

  private start(): void {
    const { cols, rows } = this.config;
    const startX = Math.floor(cols / 2);
    const startY = Math.floor(rows / 2);

    this.snake.reset(startX, startY);
    this.food.respawn(cols, rows, this.snake.getBody());
    this.score = 0;
    this.accumulator = 0;
    this.shakeAmount = 0;
    this.snapshots = [];
    this.snapshots.push(this.captureSnapshot());
    this.lastTime = performance.now();
    this.state = "running";
  }

  private captureSnapshot(): Snapshot {
    return {
      body: this.snake.getBody().map((p) => ({ ...p })),
      direction: this.snake.getDirection(),
      foodPos: { ...this.food.getPosition() },
      score: this.score,
    };
  }

  private resumeFromRewind(): void {
    if (this.snapshots.length === 0) return;
    const snap = this.snapshots[this.rewindIndex];

    this.snapshots = this.snapshots.slice(0, this.rewindIndex + 1);

    this.snake.restore(snap.body, snap.direction);
    this.food.setPosition(snap.foodPos);
    this.score = snap.score;
    this.accumulator = 0;
    this.shakeAmount = 0;
    this.lastTime = performance.now();
    this.state = "running";
  }

  private fullRestart(): void {
    this.snapshots = [];
    this.rewindIndex = 0;
    this.state = "idle";
  }

  private update(): void {
    const foodPos = this.food.getPosition();
    const head = this.snake.getHead();
    const eating = head.x === foodPos.x && head.y === foodPos.y;

    this.snake.move(eating);

    if (eating) {
      this.score += 10;
      if (this.score > this.bestScore) {
        this.bestScore = this.score;
        localStorage.setItem("snake-best", String(this.bestScore));
      }

      const cs = this.config.cellSize;
      this.particles.emit(
        foodPos.x * cs + cs / 2,
        foodPos.y * cs + cs / 2,
        14,
        FOOD_PARTICLE_COLORS
      );

      this.food.respawn(this.config.cols, this.config.rows, this.snake.getBody());
    }

    if (
      this.snake.checkWallCollision(this.config.cols, this.config.rows) ||
      this.snake.checkSelfCollision()
    ) {
      this.state = "rewind";
      this.rewindIndex = this.snapshots.length - 1;
      this.shakeAmount = 12;
      return;
    }

    this.snapshots.push(this.captureSnapshot());
  }

  private loop = (timestamp: number): void => {
    requestAnimationFrame(this.loop);

    this.pulse += 0.08;

    if (this.state === "running") {
      const delta = timestamp - this.lastTime;
      this.lastTime = timestamp;
      this.accumulator += delta;
      const interval = Math.max(80, this.config.speed - this.score * 0.5);
      if (this.accumulator >= interval) {
        this.accumulator -= interval;
        this.update();
      }
      this.particles.update();
    } else {
      this.lastTime = timestamp;
    }

    if (this.state === "rewind" && this.snapshots.length > 0) {
      if (this.keysHeld.has("a") || this.keysHeld.has("A") || this.keysHeld.has("ArrowLeft")) {
        this.rewindIndex = Math.max(0, this.rewindIndex - REWIND_SPEED);
      }
      if (this.keysHeld.has("d") || this.keysHeld.has("D") || this.keysHeld.has("ArrowRight")) {
        this.rewindIndex = Math.min(this.snapshots.length - 1, this.rewindIndex + REWIND_SPEED);
      }
    }

    let bodyToRender = this.snake.getBody();
    let foodToRender = this.food.getPosition();
    let scoreToRender = this.score;

    if (this.state === "rewind" && this.snapshots.length > 0) {
      const snap = this.snapshots[this.rewindIndex];
      bodyToRender = snap.body;
      foodToRender = snap.foodPos;
      scoreToRender = snap.score;
    }

    let sx = 0;
    let sy = 0;
    if (this.shakeAmount > 0) {
      sx = (Math.random() - 0.5) * this.shakeAmount * 2;
      sy = (Math.random() - 0.5) * this.shakeAmount * 2;
      this.shakeAmount *= 0.8;
      if (this.shakeAmount < 0.4) this.shakeAmount = 0;
    }

    const shaking = sx !== 0 || sy !== 0;
    if (shaking) this.renderer.beginShake(sx, sy);

    this.renderer.clear();
    this.renderer.drawFood(foodToRender, this.pulse);
    this.renderer.drawSnake(bodyToRender);
    if (this.state === "running") {
      this.renderer.drawParticles(this.particles);
    }
    this.renderer.drawScore(scoreToRender, this.bestScore);

    if (this.state === "rewind") {
      this.renderer.drawRewindOverlay(this.rewindIndex, this.snapshots.length);
    } else {
      this.renderer.drawOverlay(this.state, this.score, this.bestScore);
    }

    if (shaking) this.renderer.endShake();

    this.renderer.drawCRT();
  };
}

import { Snake } from "./snake.js";
import { Food } from "./food.js";
import { Renderer } from "./renderer.js";
import { Direction, GameConfig, GameState } from "./types.js";

export class Game {
  private snake: Snake;
  private food: Food;
  private renderer: Renderer;
  private config: GameConfig;

  private state: GameState = "idle";
  private score: number = 0;
  private bestScore: number = 0;
  private lastTime: number = 0;
  private accumulator: number = 0;
  private pulse: number = 0;
  private animFrameId: number = 0;

  constructor(canvas: HTMLCanvasElement, config: GameConfig) {
    this.config = config;
    this.renderer = new Renderer(canvas, config);

    const startX = Math.floor(config.cols / 2);
    const startY = Math.floor(config.rows / 2);
    this.snake = new Snake(startX, startY);
    this.food = new Food(config.cols, config.rows, this.snake.getBody());

    this.bestScore = parseInt(localStorage.getItem("snake-best") ?? "0", 10);

    this.bindInput(canvas);
    this.loop(0);
  }

  private bindInput(canvas: HTMLCanvasElement): void {
    const keyMap: Record<string, Direction> = {
      ArrowUp: "UP",
      ArrowDown: "DOWN",
      ArrowLeft: "LEFT",
      ArrowRight: "RIGHT",
      w: "UP",
      s: "DOWN",
      a: "LEFT",
      d: "RIGHT",
      W: "UP",
      S: "DOWN",
      A: "LEFT",
      D: "RIGHT",
    };

    window.addEventListener("keydown", (e) => {
      if (e.key === " ") {
        this.handleAction();
        return;
      }
      if (e.key === "p" || e.key === "P") {
        this.togglePause();
        return;
      }
      const dir = keyMap[e.key];
      if (dir) {
        e.preventDefault();
        this.snake.setDirection(dir);
        if (this.state === "idle") this.start();
      }
    });

    // Touch controls
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

      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
        this.handleAction();
        return;
      }

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
    this.lastTime = performance.now();
    this.state = "running";
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
      this.food.respawn(
        this.config.cols,
        this.config.rows,
        this.snake.getBody()
      );
    }

    if (
      this.snake.checkWallCollision(this.config.cols, this.config.rows) ||
      this.snake.checkSelfCollision()
    ) {
      this.state = "gameover";
    }
  }

  private loop = (timestamp: number): void => {
    this.animFrameId = requestAnimationFrame(this.loop);

    const delta = this.state === "running" ? timestamp - this.lastTime : 0;
    this.lastTime = timestamp;
    this.pulse += 0.1;

    if (this.state === "running") {
      this.accumulator += delta;
      const interval = Math.max(80, this.config.speed - this.score * 0.5);
      if (this.accumulator >= interval) {
        this.accumulator -= interval;
        this.update();
      }
    }

    this.renderer.clear();
    this.renderer.drawFood(this.food.getPosition(), this.pulse);
    this.renderer.drawSnake(this.snake.getBody());
    this.renderer.drawScore(this.score, this.bestScore);
    this.renderer.drawOverlay(this.state, this.score, this.bestScore);
  };
}

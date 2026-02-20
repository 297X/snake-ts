import { Point, GameConfig, GameState } from "./types.js";

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private config: GameConfig;

  constructor(canvas: HTMLCanvasElement, config: GameConfig) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Cannot get 2d context");
    this.ctx = ctx;
    this.config = config;
  }

  clear(): void {
    const { ctx, config } = this;
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(
      0,
      0,
      config.cols * config.cellSize,
      config.rows * config.cellSize
    );
    this.drawGrid();
  }

  private drawGrid(): void {
    const { ctx, config } = this;
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= config.cols; x++) {
      ctx.beginPath();
      ctx.moveTo(x * config.cellSize, 0);
      ctx.lineTo(x * config.cellSize, config.rows * config.cellSize);
      ctx.stroke();
    }
    for (let y = 0; y <= config.rows; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * config.cellSize);
      ctx.lineTo(config.cols * config.cellSize, y * config.cellSize);
      ctx.stroke();
    }
  }

  drawSnake(body: Point[]): void {
    const { ctx, config } = this;
    const cs = config.cellSize;

    body.forEach((segment, index) => {
      const ratio = 1 - (index / body.length) * 0.5;
      const g = Math.floor(200 * ratio);
      ctx.fillStyle =
        index === 0 ? "#00ff88" : `rgb(0, ${g}, ${Math.floor(100 * ratio)})`;

      const padding = index === 0 ? 1 : 2;
      ctx.beginPath();
      ctx.roundRect(
        segment.x * cs + padding,
        segment.y * cs + padding,
        cs - padding * 2,
        cs - padding * 2,
        index === 0 ? 6 : 4
      );
      ctx.fill();

      if (index === 0) {
        ctx.fillStyle = "#1a1a2e";
        const eyeSize = 3;
        ctx.fillRect(
          segment.x * cs + cs - 8,
          segment.y * cs + 5,
          eyeSize,
          eyeSize
        );
        ctx.fillRect(
          segment.x * cs + cs - 8,
          segment.y * cs + cs - 8,
          eyeSize,
          eyeSize
        );
      }
    });
  }

  drawFood(pos: Point, pulse: number): void {
    const { ctx, config } = this;
    const cs = config.cellSize;
    const scale = 1 + Math.sin(pulse) * 0.15;
    const offset = (cs * (1 - scale)) / 2;

    ctx.save();
    ctx.shadowColor = "#ff4444";
    ctx.shadowBlur = 10;
    ctx.fillStyle = "#ff4444";
    ctx.beginPath();
    ctx.roundRect(
      pos.x * cs + offset + 3,
      pos.y * cs + offset + 3,
      cs * scale - 6,
      cs * scale - 6,
      8
    );
    ctx.fill();
    ctx.restore();
  }

  drawOverlay(state: GameState, score: number, bestScore: number): void {
    if (state === "running") return;

    const { ctx, config } = this;
    const w = config.cols * config.cellSize;
    const h = config.rows * config.cellSize;

    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = "center";

    if (state === "idle") {
      ctx.fillStyle = "#00ff88";
      ctx.font = "bold 48px monospace";
      ctx.fillText("SNAKE", w / 2, h / 2 - 60);

      ctx.fillStyle = "#ffffff";
      ctx.font = "20px monospace";
      ctx.fillText("Press SPACE or tap to start", w / 2, h / 2);

      ctx.fillStyle = "#aaaaaa";
      ctx.font = "14px monospace";
      ctx.fillText("Arrow Keys / WASD to move", w / 2, h / 2 + 35);
      ctx.fillText("P to pause", w / 2, h / 2 + 55);
    } else if (state === "gameover") {
      ctx.fillStyle = "#ff4444";
      ctx.font = "bold 40px monospace";
      ctx.fillText("GAME OVER", w / 2, h / 2 - 60);

      ctx.fillStyle = "#ffffff";
      ctx.font = "22px monospace";
      ctx.fillText(`Score: ${score}`, w / 2, h / 2 - 10);

      ctx.fillStyle = "#ffcc00";
      ctx.font = "18px monospace";
      ctx.fillText(`Best: ${bestScore}`, w / 2, h / 2 + 20);

      ctx.fillStyle = "#aaaaaa";
      ctx.font = "16px monospace";
      ctx.fillText("Press SPACE or tap to restart", w / 2, h / 2 + 60);
    } else if (state === "paused") {
      ctx.fillStyle = "#ffcc00";
      ctx.font = "bold 40px monospace";
      ctx.fillText("PAUSED", w / 2, h / 2 - 20);

      ctx.fillStyle = "#aaaaaa";
      ctx.font = "16px monospace";
      ctx.fillText("Press P to resume", w / 2, h / 2 + 25);
    }
  }

  drawScore(score: number, bestScore: number): void {
    const { ctx, config } = this;
    const w = config.cols * config.cellSize;

    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(0, 0, w, 36);

    ctx.fillStyle = "#00ff88";
    ctx.font = "bold 16px monospace";
    ctx.fillText(`Score: ${score}`, 10, 22);

    ctx.fillStyle = "#ffcc00";
    ctx.textAlign = "right";
    ctx.fillText(`Best: ${bestScore}`, w - 10, 22);
  }
}

import { Point, GameConfig, GameState } from "./types.js";
import { ParticleSystem } from "./particles.js";

const P = {
  black:      "#000000",
  darkBlue:   "#1d2b53",
  darkPurple: "#7e2553",
  darkGreen:  "#008751",
  brown:      "#ab5236",
  darkGrey:   "#5f574f",
  grey:       "#c2c3c7",
  white:      "#fff1e8",
  red:        "#ff004d",
  orange:     "#ffa300",
  yellow:     "#ffec27",
  green:      "#00e436",
  blue:       "#29adff",
  lavender:   "#83769c",
  pink:       "#ff77a8",
  peach:      "#ffccaa",
};

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private config: GameConfig;

  constructor(canvas: HTMLCanvasElement, config: GameConfig) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Cannot get 2d context");
    this.ctx = ctx;
    this.config = config;
    ctx.imageSmoothingEnabled = false;
  }

  beginShake(x: number, y: number): void {
    this.ctx.save();
    this.ctx.translate(x, y);
  }

  endShake(): void {
    this.ctx.restore();
  }

  clear(): void {
    const { ctx, config } = this;
    const w = config.cols * config.cellSize;
    const h = config.rows * config.cellSize;

    ctx.fillStyle = "#0f0e17";
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "#181625";
    for (let x = 0; x < config.cols; x++) {
      for (let y = 0; y < config.rows; y++) {
        ctx.fillRect(
          x * config.cellSize + Math.floor(config.cellSize / 2),
          y * config.cellSize + Math.floor(config.cellSize / 2),
          1, 1
        );
      }
    }
  }

  drawSnake(body: Point[]): void {
    const { ctx, config } = this;
    const cs = config.cellSize;

    for (let i = body.length - 1; i >= 0; i--) {
      const seg = body[i];
      const isHead = i === 0;
      const x = seg.x * cs;
      const y = seg.y * cs;
      const pad = 1;

      ctx.fillStyle = P.black;
      ctx.fillRect(x + pad + 1, y + pad + 1, cs - pad * 2, cs - pad * 2);

      if (isHead) {
        ctx.fillStyle = P.yellow;
      } else {
        ctx.fillStyle = i % 2 === 0 ? P.green : P.darkGreen;
      }
      ctx.fillRect(x + pad, y + pad, cs - pad * 2, cs - pad * 2);

      ctx.fillStyle = isHead ? P.white : "#5dff6b";
      ctx.fillRect(x + pad + 1, y + pad + 1, 2, 2);

      if (isHead) {
        ctx.fillStyle = P.black;
        ctx.fillRect(x + cs - 7, y + 4,      3, 3);
        ctx.fillRect(x + cs - 7, y + cs - 7, 3, 3);
        ctx.fillStyle = P.white;
        ctx.fillRect(x + cs - 6, y + 5,      1, 1);
        ctx.fillRect(x + cs - 6, y + cs - 6, 1, 1);
      }
    }
  }

  drawFood(pos: Point, pulse: number): void {
    const { ctx, config } = this;
    const cs = config.cellSize;
    const x = pos.x * cs;
    const y = pos.y * cs;
    const blink = Math.sin(pulse * 3) > 0.3;
    const pad = 3;

    ctx.fillStyle = P.darkPurple;
    ctx.fillRect(x + pad + 1, y + pad + 1, cs - pad * 2, cs - pad * 2);

    ctx.fillStyle = P.red;
    ctx.fillRect(x + pad, y + pad, cs - pad * 2, cs - pad * 2);

    if (blink) {
      ctx.fillStyle = P.orange;
      ctx.fillRect(x + pad + 1, y + pad + 1, 3, 3);
    }

    ctx.fillStyle = P.darkGreen;
    ctx.fillRect(x + Math.floor(cs / 2) - 1, y + pad - 2, 2, 3);
  }

  drawParticles(particles: ParticleSystem): void {
    particles.draw(this.ctx);
  }

  drawCRT(): void {
    const { ctx, config } = this;
    const w = config.cols * config.cellSize;
    const h = config.rows * config.cellSize;

    ctx.fillStyle = "rgba(0,0,0,0.12)";
    for (let y = 0; y < h; y += 2) {
      ctx.fillRect(0, y, w, 1);
    }

    const grad = ctx.createRadialGradient(w / 2, h / 2, h * 0.25, w / 2, h / 2, h * 0.85);
    grad.addColorStop(0, "transparent");
    grad.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  drawScore(score: number, bestScore: number): void {
    const { ctx, config } = this;
    const w = config.cols * config.cellSize;

    ctx.fillStyle = P.darkBlue;
    ctx.fillRect(0, 0, w, 30);

    ctx.fillStyle = P.darkPurple;
    ctx.fillRect(0, 30, w, 2);

    ctx.font = "bold 10px 'Press Start 2P', monospace";
    ctx.textBaseline = "middle";

    ctx.fillStyle = P.yellow;
    ctx.textAlign = "left";
    ctx.fillText(`${score}`, 8, 16);

    ctx.fillStyle = P.lavender;
    ctx.textAlign = "right";
    ctx.fillText(`BEST ${bestScore}`, w - 8, 16);
  }

  drawRewindOverlay(rewindIndex: number, total: number): void {
    const { ctx, config } = this;
    const w = config.cols * config.cellSize;
    const h = config.rows * config.cellSize;
    const hudH = 32;
    const atEnd = rewindIndex >= total - 1;

    // Blue tint over the game world (skip HUD)
    ctx.fillStyle = "rgba(29, 43, 83, 0.5)";
    ctx.fillRect(0, hudH, w, h - hudH);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (atEnd) {
      ctx.fillStyle = P.red;
      ctx.font = "bold 14px 'Press Start 2P', monospace";
      ctx.fillText("GAME OVER", w / 2, hudH + (h - hudH) * 0.3);
    }

    // Bottom panel
    const panelH = 58;
    const panelY = h - panelH;

    ctx.fillStyle = "rgba(10, 9, 18, 0.92)";
    ctx.fillRect(0, panelY, w, panelH);

    ctx.fillStyle = P.darkPurple;
    ctx.fillRect(0, panelY, w, 2);

    ctx.fillStyle = atEnd ? P.red : P.blue;
    ctx.font = "bold 8px 'Press Start 2P', monospace";
    ctx.textAlign = "center";
    ctx.fillText(atEnd ? "GAME OVER — REWIND?" : "REWIND MODE", w / 2, panelY + 14);

    // Timeline bar
    const barPad = 8;
    const barX = barPad;
    const barY = panelY + 26;
    const barW = w - barPad * 2;
    const barH = 8;
    const progress = total > 1 ? rewindIndex / (total - 1) : 1;

    ctx.fillStyle = P.darkGrey;
    ctx.fillRect(barX, barY, barW, barH);

    const fillW = Math.round(barW * progress);
    ctx.fillStyle = atEnd ? P.red : P.blue;
    if (fillW > 0) ctx.fillRect(barX, barY, fillW, barH);

    // Cursor notch
    ctx.fillStyle = P.white;
    ctx.fillRect(barX + fillW - 1, barY - 2, 3, barH + 4);

    // Step counter + controls
    ctx.font = "6px 'Press Start 2P', monospace";
    ctx.fillStyle = P.grey;

    ctx.textAlign = "left";
    ctx.fillText(`${rewindIndex + 1}/${total}`, barX, panelY + 46);

    ctx.textAlign = "right";
    ctx.fillText("A\u25c4  \u25baD   SPACE:GO   ESC:NEW", w - barPad, panelY + 46);
  }

  drawOverlay(state: GameState, score: number, bestScore: number): void {
    if (state === "running") return;

    const { ctx, config } = this;
    const w = config.cols * config.cellSize;
    const h = config.rows * config.cellSize;

    ctx.fillStyle = "rgba(15,14,23,0.88)";
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (state === "idle") {
      ctx.fillStyle = P.yellow;
      ctx.font = "bold 22px 'Press Start 2P', monospace";
      ctx.fillText("SNAKE", w / 2, h / 2 - 65);

      ctx.fillStyle = P.orange;
      ctx.fillRect(w / 2 - 70, h / 2 - 52, 140, 3);

      ctx.fillStyle = P.white;
      ctx.font = "bold 8px 'Press Start 2P', monospace";
      ctx.fillText("PRESS SPACE TO START", w / 2, h / 2 - 10);

      ctx.fillStyle = P.grey;
      ctx.font = "7px 'Press Start 2P', monospace";
      ctx.fillText("ARROWS / WASD TO MOVE", w / 2, h / 2 + 18);
      ctx.fillText("P TO PAUSE", w / 2, h / 2 + 38);

    } else if (state === "paused") {
      ctx.fillStyle = P.blue;
      ctx.font = "bold 16px 'Press Start 2P', monospace";
      ctx.fillText("PAUSED", w / 2, h / 2 - 20);

      ctx.fillStyle = P.grey;
      ctx.font = "7px 'Press Start 2P', monospace";
      ctx.fillText("PRESS P TO RESUME", w / 2, h / 2 + 18);
    }
  }
}

import { Game } from "./game.js";
import { GameConfig } from "./types.js";

const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;

const config: GameConfig = {
  cols: 25,
  rows: 20,
  cellSize: 28,
  speed: 200,
};

canvas.width = config.cols * config.cellSize;
canvas.height = config.rows * config.cellSize;

new Game(canvas, config);

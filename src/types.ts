export interface Point {
  x: number;
  y: number;
}

export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

export interface GameConfig {
  cols: number;
  rows: number;
  cellSize: number;
  speed: number;
}

export type GameState = "idle" | "running" | "paused" | "gameover";

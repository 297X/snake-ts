import { Point } from "./types.js";

export class Food {
  private position: Point;

  constructor(cols: number, rows: number, exclude: Point[]) {
    this.position = this.randomPosition(cols, rows, exclude);
  }

  getPosition(): Point {
    return this.position;
  }

  setPosition(pos: Point): void {
    this.position = { ...pos };
  }

  respawn(cols: number, rows: number, exclude: Point[]): void {
    this.position = this.randomPosition(cols, rows, exclude);
  }

  private randomPosition(cols: number, rows: number, exclude: Point[]): Point {
    let pos: Point;
    do {
      pos = {
        x: Math.floor(Math.random() * cols),
        y: Math.floor(Math.random() * rows),
      };
    } while (exclude.some((p) => p.x === pos.x && p.y === pos.y));
    return pos;
  }
}

import { Point, Direction } from "./types.js";

export class Snake {
  private body: Point[];
  private direction: Direction;
  private nextDirection: Direction;

  constructor(startX: number, startY: number) {
    this.body = [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY },
    ];
    this.direction = "RIGHT";
    this.nextDirection = "RIGHT";
  }

  getBody(): Point[] {
    return this.body;
  }

  getHead(): Point {
    return this.body[0];
  }

  getLength(): number {
    return this.body.length;
  }

  setDirection(dir: Direction): void {
    const opposites: Record<Direction, Direction> = {
      UP: "DOWN",
      DOWN: "UP",
      LEFT: "RIGHT",
      RIGHT: "LEFT",
    };
    if (opposites[dir] !== this.direction) {
      this.nextDirection = dir;
    }
  }

  move(grow: boolean): void {
    this.direction = this.nextDirection;
    const head = this.getHead();

    const newHead: Point = { x: head.x, y: head.y };
    switch (this.direction) {
      case "UP":
        newHead.y -= 1;
        break;
      case "DOWN":
        newHead.y += 1;
        break;
      case "LEFT":
        newHead.x -= 1;
        break;
      case "RIGHT":
        newHead.x += 1;
        break;
    }

    this.body.unshift(newHead);
    if (!grow) {
      this.body.pop();
    }
  }

  checkSelfCollision(): boolean {
    const head = this.getHead();
    return this.body.slice(1).some((p) => p.x === head.x && p.y === head.y);
  }

  checkWallCollision(cols: number, rows: number): boolean {
    const head = this.getHead();
    return head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows;
  }

  reset(startX: number, startY: number): void {
    this.body = [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY },
    ];
    this.direction = "RIGHT";
    this.nextDirection = "RIGHT";
  }
}

import { Boid } from './Boid';
import {
  PREDATOR_SPEED,
  PREDATOR_MAX_FORCE,
  PREDATOR_EAT_RADIUS,
} from './constants';
import { Vec2, magnitude, normalize, limit } from './vec2';

export class Predator {
  x: number;
  y: number;
  vx: number;
  vy: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    // 初期速度はランダムな方向へ
    const angle = Math.random() * Math.PI * 2;
    this.vx = Math.cos(angle) * PREDATOR_SPEED;
    this.vy = Math.sin(angle) * PREDATOR_SPEED;
  }

  // ラップアラウンドを考慮したBoidへの相対位置ベクトルを返す
  private wrappedDelta(boid: Boid, width: number, height: number): Vec2 {
    let dx = boid.x - this.x;
    if (Math.abs(dx) > width / 2) dx -= Math.sign(dx) * width;
    let dy = boid.y - this.y;
    if (Math.abs(dy) > height / 2) dy -= Math.sign(dy) * height;
    return { x: dx, y: dy };
  }

  // 最も近いBoidに向かって追尾するステアリング力を計算（ラップアラウンド考慮）
  private chase(boids: Boid[], width: number, height: number): Vec2 {
    if (boids.length === 0) return { x: 0, y: 0 };

    // 最も近いBoidを探す（画面端をまたぐ最短経路で距離を測る）
    let nearest: Boid | null = null;
    let minDist = Infinity;
    for (const boid of boids) {
      const delta = this.wrappedDelta(boid, width, height);
      const dist = magnitude(delta.x, delta.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = boid;
      }
    }

    if (!nearest) return { x: 0, y: 0 };

    // 目標に向かうステアリング力を計算（ラップアラウンド考慮の最短方向）
    const delta = this.wrappedDelta(nearest, width, height);
    const norm = normalize(delta.x, delta.y);
    return limit(
      norm.x * PREDATOR_SPEED - this.vx,
      norm.y * PREDATOR_SPEED - this.vy,
      PREDATOR_MAX_FORCE,
    );
  }

  // 捕食範囲内のBoidをSetで返す（ラップアラウンド考慮）
  eat(boids: Boid[], width: number, height: number): Set<Boid> {
    const eaten = new Set<Boid>();
    for (const boid of boids) {
      const delta = this.wrappedDelta(boid, width, height);
      if (magnitude(delta.x, delta.y) < PREDATOR_EAT_RADIUS) {
        eaten.add(boid);
      }
    }
    return eaten;
  }

  // 位置・速度を更新する
  update(boids: Boid[], width: number, height: number): void {
    const steer = this.chase(boids, width, height);
    this.vx += steer.x;
    this.vy += steer.y;

    const vel = limit(this.vx, this.vy, PREDATOR_SPEED);
    this.vx = vel.x;
    this.vy = vel.y;

    this.x += this.vx;
    this.y += this.vy;

    // 画面端でラップアラウンド
    if (this.x < 0) this.x += width;
    if (this.x > width) this.x -= width;
    if (this.y < 0) this.y += height;
    if (this.y > height) this.y -= height;
  }
}

import { getRandomSpecies } from './speciesUtils';
import {
  BoidSpecies,
  MAX_SPEED,
  SEPARATION_RADIUS,
  ALIGNMENT_RADIUS,
  COHESION_RADIUS,
  SEPARATION_WEIGHT,
  ALIGNMENT_WEIGHT,
  COHESION_WEIGHT,
  PREDATOR_FLEE_RADIUS,
  PREDATOR_FLEE_WEIGHT,
  PREDATOR_FLEE_FORCE_SCALE,
} from './constants';
import { Vec2, magnitude, normalize, limit } from './vec2';
import type { Predator } from './Predator';

export class Boid {
  x: number;
  y: number;
  vx: number;
  vy: number;
  species: BoidSpecies;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    // 初期速度は定数 MAX_SPEED を使用（スポーン時点では動的パラメータを参照しない設計）
    const angle = Math.random() * Math.PI * 2;
    this.vx = Math.cos(angle) * MAX_SPEED;
    this.vy = Math.sin(angle) * MAX_SPEED;
    // 重み付きランダムで種を割り当て（イワシ多め）
    this.species = getRandomSpecies();
  }

  // 分離ルール：近くのBoidから離れる
  private separate(boids: Boid[], maxSpeed: number, maxForce: number): Vec2 {
    let sx = 0, sy = 0, count = 0;
    for (const other of boids) {
      if (other === this) continue;
      const dx = this.x - other.x;
      const dy = this.y - other.y;
      const dist = magnitude(dx, dy);
      if (dist > 0 && dist < SEPARATION_RADIUS) {
        // 距離に反比例した反発力を計算
        sx += (dx / dist) / dist;
        sy += (dy / dist) / dist;
        count++;
      }
    }
    if (count === 0) return { x: 0, y: 0 };
    const norm = normalize(sx / count, sy / count);
    return limit(norm.x * maxSpeed - this.vx, norm.y * maxSpeed - this.vy, maxForce);
  }

  // 整列ルール：近くのBoidの進行方向に合わせる
  private align(boids: Boid[], maxSpeed: number, maxForce: number): Vec2 {
    let avx = 0, avy = 0, count = 0;
    for (const other of boids) {
      if (other === this) continue;
      const dx = this.x - other.x;
      const dy = this.y - other.y;
      const dist = magnitude(dx, dy);
      if (dist > 0 && dist < ALIGNMENT_RADIUS) {
        avx += other.vx;
        avy += other.vy;
        count++;
      }
    }
    if (count === 0) return { x: 0, y: 0 };
    const norm = normalize(avx / count, avy / count);
    return limit(norm.x * maxSpeed - this.vx, norm.y * maxSpeed - this.vy, maxForce);
  }

  // 逃避ルール：捕食者が近づいたら全力で逃げる（ラップアラウンド考慮）
  private flee(predator: Predator, width: number, height: number, maxSpeed: number, maxForce: number): Vec2 {
    let dx = this.x - predator.x;
    if (Math.abs(dx) > width / 2) dx -= Math.sign(dx) * width;
    let dy = this.y - predator.y;
    if (Math.abs(dy) > height / 2) dy -= Math.sign(dy) * height;
    const dist = magnitude(dx, dy);
    if (dist <= 0 || dist > PREDATOR_FLEE_RADIUS) return { x: 0, y: 0 };
    // 捕食者が近づくほど逃避力を強める（距離に反比例）
    const strength = (PREDATOR_FLEE_RADIUS - dist) / PREDATOR_FLEE_RADIUS;
    const norm = normalize(dx, dy);
    return limit(norm.x * maxSpeed - this.vx, norm.y * maxSpeed - this.vy, maxForce * PREDATOR_FLEE_FORCE_SCALE * strength);
  }

  // 結合ルール：近くのBoidの重心に向かう
  private cohere(boids: Boid[], maxSpeed: number, maxForce: number): Vec2 {
    let cx = 0, cy = 0, count = 0;
    for (const other of boids) {
      if (other === this) continue;
      const dx = this.x - other.x;
      const dy = this.y - other.y;
      const dist = magnitude(dx, dy);
      if (dist > 0 && dist < COHESION_RADIUS) {
        cx += other.x;
        cy += other.y;
        count++;
      }
    }
    if (count === 0) return { x: 0, y: 0 };
    // 重心へのベクトルを求める
    const norm = normalize(cx / count - this.x, cy / count - this.y);
    return limit(norm.x * maxSpeed - this.vx, norm.y * maxSpeed - this.vy, maxForce);
  }

  // 位置・速度を更新する
  update(boids: Boid[], predator: Predator, width: number, height: number, maxSpeed: number, maxForce: number): void {
    const separation = this.separate(boids, maxSpeed, maxForce);
    const alignment = this.align(boids, maxSpeed, maxForce);
    const cohesion = this.cohere(boids, maxSpeed, maxForce);
    const fleeForce = this.flee(predator, width, height, maxSpeed, maxForce);

    // 各ルールの力を重み付けして加算（逃避が最優先）
    this.vx += separation.x * SEPARATION_WEIGHT + alignment.x * ALIGNMENT_WEIGHT + cohesion.x * COHESION_WEIGHT + fleeForce.x * PREDATOR_FLEE_WEIGHT;
    this.vy += separation.y * SEPARATION_WEIGHT + alignment.y * ALIGNMENT_WEIGHT + cohesion.y * COHESION_WEIGHT + fleeForce.y * PREDATOR_FLEE_WEIGHT;

    const vel = limit(this.vx, this.vy, maxSpeed);
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

import { getRandomSpecies } from './speciesUtils';
import {
  BoidSpecies,
  MAX_SPEED,
  MAX_FORCE,
  PREDATOR_FLEE_RADIUS,
  PREDATOR_FLEE_FORCE_SCALE,
  SPECIES_PARAMS,
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

  // 分離ルール：近くのBoidから離れる（種固有の分離半径を使用、全種に対して適用）
  private separate(boids: Boid[], maxSpeed: number, maxForce: number): Vec2 {
    const { separationRadius } = SPECIES_PARAMS[this.species];
    let sx = 0, sy = 0, count = 0;
    for (const other of boids) {
      if (other === this) continue;
      const dx = this.x - other.x;
      const dy = this.y - other.y;
      const dist = magnitude(dx, dy);
      if (dist > 0 && dist < separationRadius) {
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

  // 整列ルール：近くのBoidの進行方向に合わせる（同種ボイドを intraSpeciesBias 倍で優先）
  private align(boids: Boid[], maxSpeed: number, maxForce: number): Vec2 {
    const { alignmentRadius, intraSpeciesBias } = SPECIES_PARAMS[this.species];
    let avx = 0, avy = 0, totalWeight = 0;
    for (const other of boids) {
      if (other === this) continue;
      const dx = this.x - other.x;
      const dy = this.y - other.y;
      const dist = magnitude(dx, dy);
      if (dist > 0 && dist < alignmentRadius) {
        // 同種のボイドにはバイアス倍率を適用し、優先的に整列する
        const bias = other.species === this.species ? intraSpeciesBias : 1.0;
        avx += other.vx * bias;
        avy += other.vy * bias;
        totalWeight += bias;
      }
    }
    if (totalWeight === 0) return { x: 0, y: 0 };
    const norm = normalize(avx / totalWeight, avy / totalWeight);
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

  // 結合ルール：近くのBoidの重心に向かう（同種ボイドを intraSpeciesBias 倍で優先）
  private cohere(boids: Boid[], maxSpeed: number, maxForce: number): Vec2 {
    const { cohesionRadius, intraSpeciesBias } = SPECIES_PARAMS[this.species];
    let cx = 0, cy = 0, totalWeight = 0;
    for (const other of boids) {
      if (other === this) continue;
      const dx = this.x - other.x;
      const dy = this.y - other.y;
      const dist = magnitude(dx, dy);
      if (dist > 0 && dist < cohesionRadius) {
        // 同種のボイドにはバイアス倍率を適用し、優先的に凝集する
        const bias = other.species === this.species ? intraSpeciesBias : 1.0;
        cx += other.x * bias;
        cy += other.y * bias;
        totalWeight += bias;
      }
    }
    if (totalWeight === 0) return { x: 0, y: 0 };
    // 重心へのベクトルを求める
    const norm = normalize(cx / totalWeight - this.x, cy / totalWeight - this.y);
    return limit(norm.x * maxSpeed - this.vx, norm.y * maxSpeed - this.vy, maxForce);
  }

  // 位置・速度を更新する
  update(boids: Boid[], predator: Predator, width: number, height: number, maxSpeed: number, maxForce: number): void {
    const params = SPECIES_PARAMS[this.species];
    // グローバルの SimParams を比率として種固有パラメータにスケール適用
    // （SimParams スライダーで全種を一括調整しつつ、種間の相対差を保持する）
    const effectiveMaxSpeed = params.maxSpeed * (maxSpeed / MAX_SPEED);
    const effectiveMaxForce = params.maxForce * (maxForce / MAX_FORCE);

    const separation = this.separate(boids, effectiveMaxSpeed, effectiveMaxForce);
    const alignment  = this.align(boids, effectiveMaxSpeed, effectiveMaxForce);
    const cohesion   = this.cohere(boids, effectiveMaxSpeed, effectiveMaxForce);
    const fleeForce  = this.flee(predator, width, height, effectiveMaxSpeed, effectiveMaxForce);

    // 種固有の重みで各ルールの力を加算（逃避が最優先）
    this.vx += separation.x * params.separationWeight
             + alignment.x  * params.alignmentWeight
             + cohesion.x   * params.cohesionWeight
             + fleeForce.x  * params.fleeWeight;
    this.vy += separation.y * params.separationWeight
             + alignment.y  * params.alignmentWeight
             + cohesion.y   * params.cohesionWeight
             + fleeForce.y  * params.fleeWeight;

    const vel = limit(this.vx, this.vy, effectiveMaxSpeed);
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

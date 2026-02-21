'use client';

import { useEffect, useRef } from 'react';

// エイリアンのピクセルアートスプライト（スペースインベーダー風）
const ALIEN_SPRITE = [
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [1, 1, 0, 1, 1, 0, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [0, 1, 1, 0, 0, 1, 1, 0],
  [1, 0, 0, 1, 1, 0, 0, 1],
  [0, 1, 0, 0, 0, 0, 1, 0],
];

// ネオンカラーパレット
const NEON_COLORS = ['#00ff41', '#00ffff', '#ff00ff'];

const PIXEL_SIZE = 3;    // スプライトの1ピクセルのサイズ
const BOID_COUNT = 60;   // Boidの数
const MAX_SPEED = 2.0;   // 最大速度
const MAX_FORCE = 0.04;  // 最大操舵力

// 近傍範囲
const SEPARATION_RADIUS = 35;
const ALIGNMENT_RADIUS = 75;
const COHESION_RADIUS = 75;

// 各ルールの重み
const SEPARATION_WEIGHT = 1.8;
const ALIGNMENT_WEIGHT = 1.0;
const COHESION_WEIGHT = 1.0;

// ベクトルの大きさを計算
function magnitude(x: number, y: number): number {
  return Math.sqrt(x * x + y * y);
}

// ベクトルを正規化
function normalize(x: number, y: number): { x: number; y: number } {
  const mag = magnitude(x, y);
  if (mag === 0) return { x: 0, y: 0 };
  return { x: x / mag, y: y / mag };
}

// ベクトルの大きさを最大値に制限
function limit(x: number, y: number, max: number): { x: number; y: number } {
  const mag = magnitude(x, y);
  if (mag > max) {
    const scale = max / mag;
    return { x: x * scale, y: y * scale };
  }
  return { x, y };
}

class Boid {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    // ランダムな初期速度を設定
    const angle = Math.random() * Math.PI * 2;
    this.vx = Math.cos(angle) * MAX_SPEED;
    this.vy = Math.sin(angle) * MAX_SPEED;
    this.color = NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)];
  }

  // 分離ルール：近くのBoidから離れる
  separate(boids: Boid[]): { x: number; y: number } {
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
    const steer = limit(
      norm.x * MAX_SPEED - this.vx,
      norm.y * MAX_SPEED - this.vy,
      MAX_FORCE
    );
    return steer;
  }

  // 整列ルール：近くのBoidの進行方向に合わせる
  align(boids: Boid[]): { x: number; y: number } {
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
    const steer = limit(
      norm.x * MAX_SPEED - this.vx,
      norm.y * MAX_SPEED - this.vy,
      MAX_FORCE
    );
    return steer;
  }

  // 結合ルール：近くのBoidの重心に向かう
  cohere(boids: Boid[]): { x: number; y: number } {
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
    const dx = cx / count - this.x;
    const dy = cy / count - this.y;
    const norm = normalize(dx, dy);
    const steer = limit(
      norm.x * MAX_SPEED - this.vx,
      norm.y * MAX_SPEED - this.vy,
      MAX_FORCE
    );
    return steer;
  }

  // 位置・速度を更新する
  update(boids: Boid[], width: number, height: number) {
    const sep = this.separate(boids);
    const ali = this.align(boids);
    const coh = this.cohere(boids);

    // 各ルールの力を重み付けして加算
    const ax = sep.x * SEPARATION_WEIGHT + ali.x * ALIGNMENT_WEIGHT + coh.x * COHESION_WEIGHT;
    const ay = sep.y * SEPARATION_WEIGHT + ali.y * ALIGNMENT_WEIGHT + coh.y * COHESION_WEIGHT;

    this.vx += ax;
    this.vy += ay;
    const vel = limit(this.vx, this.vy, MAX_SPEED);
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

  // エイリアンのピクセルアートを描画する
  draw(ctx: CanvasRenderingContext2D) {
    const spriteW = ALIEN_SPRITE[0].length * PIXEL_SIZE;
    const spriteH = ALIEN_SPRITE.length * PIXEL_SIZE;
    const offsetX = -spriteW / 2;
    const offsetY = -spriteH / 2;

    // 進行方向に向けて回転
    const angle = Math.atan2(this.vy, this.vx);

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(angle + Math.PI / 2);

    // グロウエフェクトを設定
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.fillStyle = this.color;

    // ピクセルアートを1マスずつ描画
    for (let row = 0; row < ALIEN_SPRITE.length; row++) {
      for (let col = 0; col < ALIEN_SPRITE[row].length; col++) {
        if (ALIEN_SPRITE[row][col] === 1) {
          ctx.fillRect(
            offsetX + col * PIXEL_SIZE,
            offsetY + row * PIXEL_SIZE,
            PIXEL_SIZE,
            PIXEL_SIZE
          );
        }
      }
    }

    ctx.restore();
  }
}

// CRTフィルターオーバーレイを描画する
function drawCRTOverlay(ctx: CanvasRenderingContext2D, width: number, height: number) {
  // スキャンラインを描画
  ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
  for (let y = 0; y < height; y += 3) {
    ctx.fillRect(0, y, width, 1);
  }

  // 画面端のビネット効果
  const vignette = ctx.createRadialGradient(
    width / 2, height / 2, height * 0.35,
    width / 2, height / 2, height * 0.85
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

export default function BoidsCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // キャンバスをウィンドウサイズにリサイズ
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Boidを初期化
    const boids: Boid[] = [];
    for (let i = 0; i < BOID_COUNT; i++) {
      boids.push(new Boid(
        Math.random() * canvas.width,
        Math.random() * canvas.height
      ));
    }

    let animId: number;

    const animate = () => {
      // 背景を黒でクリア
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 各Boidを更新して描画
      for (const boid of boids) {
        boid.update(boids, canvas.width, canvas.height);
        boid.draw(ctx);
      }

      // CRTオーバーレイを重ねる
      drawCRTOverlay(ctx, canvas.width, canvas.height);

      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="block"
      style={{ cursor: 'crosshair' }}
    />
  );
}

import { Boid } from './Boid';
import {
  BoidSpecies,
  SPECIES_SPRITES,
  SPECIES_COLORS,
  SPECIES_PIXEL_SIZES,
  OCTOPUS_INK_CLOUD_DURATION_MS,
  OCTOPUS_INK_CLOUD_MAX_RADIUS,
} from './constants';

// シードベースの疑似乱数（Mulberry32 アルゴリズム）— チラつき防止のため決定論的
function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
}

// タコのスミ雲を放出位置に描画する（ドットパターンで拡大しながらフェードアウト）
export function drawInkCloud(ctx: CanvasRenderingContext2D, boid: Boid, now: number): void {
  if (boid.species !== BoidSpecies.Octopus) return;
  const age = now - boid.lastInkedAt;
  if (age < 0 || age > OCTOPUS_INK_CLOUD_DURATION_MS) return;

  // progress: 0 → 1（放出直後 → 消滅）
  const progress = age / OCTOPUS_INK_CLOUD_DURATION_MS;
  // 最初は素早く広がり後半はゆっくり広がる（√ カーブ）。最小半径 5px を保証
  const radius = Math.max(5, OCTOPUS_INK_CLOUD_MAX_RADIUS * Math.sqrt(progress));
  // 時間とともに透明になる
  const alpha = (1 - progress) * 0.92;

  ctx.save();

  // CRT ピクセルアートスタイルのドットパターンでスミ雲を描画
  // 最大半径全域を固定グリッドで反復 → シード一貫性を保ちチラつきを防ぐ
  const dotSize  = 3; // ドット一辺（px）
  const gridStep = 6; // ドット間隔（px）
  const rng = seededRng(boid.lastInkedAt);

  for (let dy = -OCTOPUS_INK_CLOUD_MAX_RADIUS; dy <= OCTOPUS_INK_CLOUD_MAX_RADIUS; dy += gridStep) {
    for (let dx = -OCTOPUS_INK_CLOUD_MAX_RADIUS; dx <= OCTOPUS_INK_CLOUD_MAX_RADIUS; dx += gridStep) {
      // 常に rng を消費してシーケンスを一定に保つ
      const roll = rng();
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > radius) continue; // 現在の半径外はスキップ

      // 中心に近いほど密に、外側ほど間引く
      const density = 1 - dist / radius;
      if (roll > density) continue;

      // 黒背景で視認しやすい薄紫がかったグレー（スミらしい色調）
      const dotAlpha = alpha * (0.6 + density * 0.4);
      ctx.fillStyle = `rgba(160, 140, 180, ${dotAlpha.toFixed(2)})`;
      ctx.fillRect(
        boid.lastInkX + dx - dotSize / 2,
        boid.lastInkY + dy - dotSize / 2,
        dotSize,
        dotSize,
      );
    }
  }

  ctx.restore();
}

// Boidを種別に対応したピクセルアートスプライトでCanvasに描画する
export function drawBoid(ctx: CanvasRenderingContext2D, boid: Boid): void {
  const sprite    = SPECIES_SPRITES[boid.species];
  const pixelSize = SPECIES_PIXEL_SIZES[boid.species];
  const color     = SPECIES_COLORS[boid.species];

  const offsetX = -(sprite[0].length * pixelSize) / 2;
  const offsetY = -(sprite.length    * pixelSize) / 2;

  ctx.save();
  ctx.translate(boid.x, boid.y);
  // 進行方向に向けて回転
  ctx.rotate(Math.atan2(boid.vy, boid.vx) + Math.PI / 2);

  ctx.shadowBlur  = 10;
  ctx.shadowColor = color;
  ctx.fillStyle   = color;

  // ピクセルアートを1マスずつ描画
  for (let row = 0; row < sprite.length; row++) {
    const rowData = sprite[row];
    for (let col = 0; col < rowData.length; col++) {
      if (rowData[col] === 1) {
        ctx.fillRect(
          offsetX + col * pixelSize,
          offsetY + row * pixelSize,
          pixelSize,
          pixelSize,
        );
      }
    }
  }

  ctx.restore();
}

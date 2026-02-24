import { Boid } from './Boid';
import {
  BoidSpecies,
  SPECIES_SPRITES,
  SPECIES_COLORS,
  SPECIES_PIXEL_SIZES,
  OCTOPUS_INK_CLOUD_DURATION_MS,
  OCTOPUS_INK_CLOUD_MAX_RADIUS,
} from './constants';

// タコのスミ雲を放出位置に描画する（拡大しながらフェードアウト）
export function drawInkCloud(ctx: CanvasRenderingContext2D, boid: Boid, now: number): void {
  if (boid.species !== BoidSpecies.Octopus) return;
  const age = now - boid.lastInkedAt;
  if (age < 0 || age > OCTOPUS_INK_CLOUD_DURATION_MS) return;

  // progress: 0 → 1（放出直後 → 消滅）
  const progress = age / OCTOPUS_INK_CLOUD_DURATION_MS;
  // 最初は素早く広がり後半はゆっくり広がる（√ カーブ）。最小半径 5px を保証
  const radius = Math.max(5, OCTOPUS_INK_CLOUD_MAX_RADIUS * Math.sqrt(progress));
  // 時間とともに透明になる
  const alpha  = (1 - progress) * 0.7;

  ctx.save();
  const grad = ctx.createRadialGradient(
    boid.lastInkX, boid.lastInkY, 0,
    boid.lastInkX, boid.lastInkY, radius,
  );
  grad.addColorStop(0,   `rgba(90, 90, 90, ${alpha})`);
  grad.addColorStop(0.5, `rgba(60, 60, 60, ${alpha * 0.55})`);
  grad.addColorStop(1,   `rgba(30, 30, 30, 0)`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(boid.lastInkX, boid.lastInkY, radius, 0, Math.PI * 2);
  ctx.fill();
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

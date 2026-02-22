import { Boid } from './Boid';
import { SPECIES_SPRITES, SPECIES_COLORS, SPECIES_PIXEL_SIZES } from './constants';

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
    for (let col = 0; col < sprite[row].length; col++) {
      if (sprite[row][col] === 1) {
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

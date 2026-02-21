import { Boid } from './Boid';
import { ALIEN_SPRITE, PIXEL_SIZE } from './constants';

// BoidをエイリアンのピクセルアートとしてCanvasに描画する
export function drawBoid(ctx: CanvasRenderingContext2D, boid: Boid): void {
  const offsetX = -(ALIEN_SPRITE[0].length * PIXEL_SIZE) / 2;
  const offsetY = -(ALIEN_SPRITE.length * PIXEL_SIZE) / 2;

  ctx.save();
  ctx.translate(boid.x, boid.y);
  // 進行方向に向けて回転
  ctx.rotate(Math.atan2(boid.vy, boid.vx) + Math.PI / 2);

  ctx.shadowBlur = 10;
  ctx.shadowColor = boid.color;
  ctx.fillStyle = boid.color;

  // ピクセルアートを1マスずつ描画
  for (let row = 0; row < ALIEN_SPRITE.length; row++) {
    for (let col = 0; col < ALIEN_SPRITE[row].length; col++) {
      if (ALIEN_SPRITE[row][col] === 1) {
        ctx.fillRect(
          offsetX + col * PIXEL_SIZE,
          offsetY + row * PIXEL_SIZE,
          PIXEL_SIZE,
          PIXEL_SIZE,
        );
      }
    }
  }

  ctx.restore();
}

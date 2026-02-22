import { Predator } from './Predator';
import { SHARK_SPRITE, PREDATOR_PIXEL_SIZE, PREDATOR_COLOR } from './constants';

// 捕食者（サメ）をピクセルアートとしてCanvasに描画する
export function drawPredator(ctx: CanvasRenderingContext2D, predator: Predator): void {
  const offsetX = -(SHARK_SPRITE[0].length * PREDATOR_PIXEL_SIZE) / 2;
  const offsetY = -(SHARK_SPRITE.length    * PREDATOR_PIXEL_SIZE) / 2;

  ctx.save();
  ctx.translate(predator.x, predator.y);
  // 進行方向に向けて回転（Boidと同じ規則）
  ctx.rotate(Math.atan2(predator.vy, predator.vx) + Math.PI / 2);

  ctx.shadowBlur  = 20;
  ctx.shadowColor = PREDATOR_COLOR;
  ctx.fillStyle   = PREDATOR_COLOR;

  // ピクセルアートを1マスずつ描画
  for (let row = 0; row < SHARK_SPRITE.length; row++) {
    for (let col = 0; col < SHARK_SPRITE[row].length; col++) {
      if (SHARK_SPRITE[row][col] === 1) {
        ctx.fillRect(
          offsetX + col * PREDATOR_PIXEL_SIZE,
          offsetY + row * PREDATOR_PIXEL_SIZE,
          PREDATOR_PIXEL_SIZE,
          PREDATOR_PIXEL_SIZE,
        );
      }
    }
  }

  ctx.restore();
}

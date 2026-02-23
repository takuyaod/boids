import { Predator } from './Predator';
import {
  SHARK_SPRITE,
  PREDATOR_PIXEL_SIZE,
  PREDATOR_COLOR,
  PREDATOR_STUN_COLOR,
  PREDATOR_STUN_DOT_COUNT,
  PREDATOR_STUN_DOT_ORBIT,
  PREDATOR_STUN_DOT_RADIUS,
  PREDATOR_STUN_ORBIT_WOBBLE,
} from './constants';

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

  // しびれ中は黄色ドットエフェクトを描画
  if (predator.isStunned) {
    const now = performance.now();
    drawStunEffect(ctx, predator, now);
  }
}

// しびれエフェクト：黄色ドットが捕食者の周囲を回転する
function drawStunEffect(ctx: CanvasRenderingContext2D, predator: Predator, now: number): void {
  // sin 波による点滅（0.7〜1.0 の範囲でアルファを変化）
  const blink = 0.7 + 0.3 * (0.5 + 0.5 * Math.sin(now * 0.01));

  ctx.save();
  ctx.shadowBlur  = 10;
  ctx.shadowColor = PREDATOR_STUN_COLOR;
  ctx.fillStyle   = PREDATOR_STUN_COLOR;
  ctx.globalAlpha = blink;

  for (let i = 0; i < PREDATOR_STUN_DOT_COUNT; i++) {
    // フレームごとに回転し、各ドットを等間隔に配置
    const angle = now * 0.003 + (i * Math.PI * 2) / PREDATOR_STUN_DOT_COUNT;
    // 振動で軌道半径をわずかに変化させてしびれ感を演出
    const orbit = PREDATOR_STUN_DOT_ORBIT + PREDATOR_STUN_ORBIT_WOBBLE * Math.sin(now * 0.008 + i);
    const dotX  = predator.x + Math.cos(angle) * orbit;
    const dotY  = predator.y + Math.sin(angle) * orbit;

    ctx.beginPath();
    ctx.arc(dotX, dotY, PREDATOR_STUN_DOT_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

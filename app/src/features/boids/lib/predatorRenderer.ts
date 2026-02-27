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
  PREDATOR_CONFUSION_COLOR,
  PREDATOR_CONFUSION_DOT_COUNT,
  PREDATOR_CONFUSION_DOT_ORBIT,
  PREDATOR_CONFUSION_DOT_RADIUS,
} from './constants';

// 捕食者（サメ）をピクセルアートとしてCanvasに描画する
export function drawPredator(ctx: CanvasRenderingContext2D, predator: Predator): void {
  const offsetX = -(SHARK_SPRITE[0].length * PREDATOR_PIXEL_SIZE) / 2;
  const offsetY = -(SHARK_SPRITE.length    * PREDATOR_PIXEL_SIZE) / 2;

  ctx.save();
  ctx.translate(predator.x, predator.y);
  // 進行方向に向けて回転（しびれ中は vx/vy がゼロになるため angle ゲッターで保持した角度を使用）
  ctx.rotate(predator.angle + Math.PI / 2);

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

  const now = performance.now();
  // しびれ中は黄色ドットエフェクトを描画（混乱エフェクトより優先）
  if (predator.isStunned) {
    drawStunEffect(ctx, predator, now);
  } else if (predator.isConfused) {
    // 混乱中は「？」を点滅表示
    drawConfusionEffect(ctx, predator, now);
  }
}

// 混乱エフェクト：白いドットが反時計回りに回転（しびれの黄色時計回りと逆方向で区別）
function drawConfusionEffect(ctx: CanvasRenderingContext2D, predator: Predator, now: number): void {
  const blink = 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(now * 0.008));

  ctx.save();
  ctx.shadowBlur  = 10;
  ctx.shadowColor = PREDATOR_CONFUSION_COLOR;
  ctx.fillStyle   = PREDATOR_CONFUSION_COLOR;
  ctx.globalAlpha = blink;

  for (let i = 0; i < PREDATOR_CONFUSION_DOT_COUNT; i++) {
    // 反時計回りにゆっくり回転
    const angle = -now * 0.002 + (i * Math.PI * 2) / PREDATOR_CONFUSION_DOT_COUNT;
    const dotX  = predator.x + Math.cos(angle) * PREDATOR_CONFUSION_DOT_ORBIT;
    const dotY  = predator.y + Math.sin(angle) * PREDATOR_CONFUSION_DOT_ORBIT;

    ctx.beginPath();
    ctx.arc(dotX, dotY, PREDATOR_CONFUSION_DOT_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
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

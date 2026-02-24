import type { BoidsRenderer } from './renderer';
import type { Boid } from './Boid';
import type { Predator } from './Predator';
import { drawBoid, drawInkCloud } from './boidRenderer';
import { drawPredator } from './predatorRenderer';
import { type CRTCache, createCRTCache, drawCRTOverlay } from './crt';

// 既存の Canvas 2D 描画関数をレンダラーインターフェースでラップする
export class Canvas2DRenderer implements BoidsRenderer {
  private ctx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;
  private crtCache!: CRTCache;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D コンテキストの取得に失敗しました');
    this.ctx = ctx;
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    // リサイズ時に CRT キャッシュを再生成
    this.crtCache = createCRTCache(this.ctx, width, height);
  }

  render(boids: Boid[], predator: Predator): void {
    const { ctx, width, height } = this;
    const now = performance.now();

    // 背景を黒でクリア
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // スミ雲を Boid より先に描画（背面レイヤーとして表示）
    for (const boid of boids) {
      drawInkCloud(ctx, boid, now);
    }

    // 各 Boid を描画
    for (const boid of boids) {
      drawBoid(ctx, boid);
    }

    // 捕食者を描画
    drawPredator(ctx, predator);

    // CRT オーバーレイを重ねる
    drawCRTOverlay(ctx, this.crtCache, width, height);
  }

  destroy(): void {
    // Canvas 2D は GPU リソースを持たないため何もしない
  }
}

'use client';

import { useEffect, useRef } from 'react';
import { Boid } from '../lib/Boid';
import { Predator } from '../lib/Predator';
import { drawBoid } from '../lib/boidRenderer';
import { drawPredator } from '../lib/predatorRenderer';
import { CRTCache, createCRTCache, drawCRTOverlay } from '../lib/crt';
import { BOID_COUNT } from '../lib/constants';
import { spawnBoidsAtEdge } from '../lib/spawnUtils';
import { type SpeciesCounts, createEmptySpeciesCounts } from '../lib/speciesUtils';

export type { SpeciesCounts };

// Props 型定義
type BoidsCanvasProps = {
  onCountsUpdate?: (counts: SpeciesCounts) => void;
};

// 種別ごとの個体数を集計する
function buildSpeciesCounts(boids: Boid[]): SpeciesCounts {
  const counts = createEmptySpeciesCounts();
  for (const boid of boids) {
    counts[boid.species]++;
  }
  return counts;
}

export default function BoidsCanvas({ onCountsUpdate }: BoidsCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // コールバックの最新参照を保持（アニメーションループの再起動を防ぐ）
  const onCountsUpdateRef = useRef(onCountsUpdate);
  useEffect(() => {
    onCountsUpdateRef.current = onCountsUpdate;
  }, [onCountsUpdate]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // コンテナサイズに合わせてキャンバスをリサイズ
    let crtCache: CRTCache;
    const resize = () => {
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
      // リサイズ時にCRTキャッシュを再生成
      crtCache = createCRTCache(ctx, canvas.width, canvas.height);
    };
    resize();

    // コンテナのサイズ変化を監視
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    // Boidを初期化
    const boids: Boid[] = Array.from({ length: BOID_COUNT }, () =>
      new Boid(Math.random() * canvas.width, Math.random() * canvas.height)
    );

    // 捕食者を画面中央に1体生成
    const predator = new Predator(canvas.width / 2, canvas.height / 2);

    let animId: number = 0;
    let lastCountUpdate = 0;

    const animate = () => {
      // 背景を黒でクリア
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 捕食者を更新
      predator.update(boids, canvas.width, canvas.height);

      // 捕食範囲内のBoidを配列から除去
      const eaten = predator.eat(boids, canvas.width, canvas.height);
      if (eaten.size > 0) {
        // 後ろから削除することでインデックスのずれを防ぐ
        for (let i = boids.length - 1; i >= 0; i--) {
          if (eaten.has(boids[i])) boids.splice(i, 1);
        }
        // 捕食された数だけ画面端に新しいBoidを再スポーン
        boids.push(...spawnBoidsAtEdge(eaten.size, canvas.width, canvas.height));
      }

      // 各Boidを更新して描画
      for (const boid of boids) {
        boid.update(boids, predator, canvas.width, canvas.height);
        drawBoid(ctx, boid);
      }

      // 捕食者を描画
      drawPredator(ctx, predator);

      // CRTオーバーレイを重ねる
      drawCRTOverlay(ctx, crtCache, canvas.width, canvas.height);

      // 500ms ごとに種別ごとの個体数をカウントして通知
      const now = performance.now();
      if (onCountsUpdateRef.current && now - lastCountUpdate >= 500) {
        lastCountUpdate = now;
        onCountsUpdateRef.current(buildSpeciesCounts(boids));
      }

      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ cursor: 'crosshair' }}
      />
    </div>
  );
}

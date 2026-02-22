'use client';

import { useEffect, useRef } from 'react';
import { Boid } from '../lib/Boid';
import { Predator } from '../lib/Predator';
import { BOID_COUNT } from '../lib/constants';
import { spawnBoidsAtEdge } from '../lib/spawnUtils';
import { type SpeciesCounts, createEmptySpeciesCounts } from '../lib/speciesUtils';
import { createRenderer, type BoidsRenderer, type RendererType } from '../lib/renderer';

export type { SpeciesCounts };

// Props 型定義
type BoidsCanvasProps = {
  onCountsUpdate?: (counts: SpeciesCounts) => void;
  onRendererReady?: (type: RendererType) => void;
};

// 種別ごとの個体数を集計する
function buildSpeciesCounts(boids: Boid[]): SpeciesCounts {
  const counts = createEmptySpeciesCounts();
  for (const boid of boids) {
    counts[boid.species]++;
  }
  return counts;
}

export default function BoidsCanvas({ onCountsUpdate, onRendererReady }: BoidsCanvasProps) {
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

    let renderer: BoidsRenderer | null = null;
    let animId = 0;
    let mounted = true;
    let resizeObserver: ResizeObserver | null = null;

    // WebGPU 対応チェック → 非対応時は Canvas 2D にフォールバック
    void (async () => {
      const result = await createRenderer(canvas);
      renderer = result.renderer;
      onRendererReady?.(result.type);
      if (!mounted) {
        renderer.destroy();
        return;
      }

      // コンテナサイズに合わせてキャンバスをリサイズ
      const resize = () => {
        const w = container.offsetWidth;
        const h = container.offsetHeight;
        canvas.width = w;
        canvas.height = h;
        renderer!.resize(w, h);
      };
      resize();

      // コンテナのサイズ変化を監視
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(container);

      // Boid を初期化
      const boids: Boid[] = Array.from({ length: BOID_COUNT }, () =>
        new Boid(Math.random() * canvas.width, Math.random() * canvas.height),
      );

      // 捕食者を画面中央に 1 体生成
      const predator = new Predator(canvas.width / 2, canvas.height / 2);

      let lastCountUpdate = 0;

      const animate = () => {
        // 捕食者を更新
        predator.update(boids, canvas.width, canvas.height);

        // 捕食範囲内の Boid を配列から除去
        const eaten = predator.eat(boids, canvas.width, canvas.height);
        if (eaten.size > 0) {
          // 後ろから削除することでインデックスのずれを防ぐ
          for (let i = boids.length - 1; i >= 0; i--) {
            if (eaten.has(boids[i])) boids.splice(i, 1);
          }
          // 捕食された数だけ画面端に新しい Boid を再スポーン
          boids.push(...spawnBoidsAtEdge(eaten.size, canvas.width, canvas.height));
        }

        // 各 Boid を更新
        for (const boid of boids) {
          boid.update(boids, predator, canvas.width, canvas.height);
        }

        // レンダラーで描画（Boid・捕食者・CRT オーバーレイ）
        renderer!.render(boids, predator);

        // 500ms ごとに種別ごとの個体数をカウントして通知
        const now = performance.now();
        if (onCountsUpdateRef.current && now - lastCountUpdate >= 500) {
          lastCountUpdate = now;
          onCountsUpdateRef.current(buildSpeciesCounts(boids));
        }

        animId = requestAnimationFrame(animate);
      };

      animate();
    })();

    return () => {
      mounted = false;
      cancelAnimationFrame(animId);
      resizeObserver?.disconnect();
      renderer?.destroy();
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

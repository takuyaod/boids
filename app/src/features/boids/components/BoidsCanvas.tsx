'use client';

import { useEffect, useRef } from 'react';
import { Boid } from '../lib/Boid';
import { Predator } from '../lib/Predator';
import { drawBoid } from '../lib/boidRenderer';
import { drawPredator } from '../lib/predatorRenderer';
import { CRTCache, createCRTCache, drawCRTOverlay } from '../lib/crt';
import { BOID_COUNT } from '../lib/constants';

export default function BoidsCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // キャンバスをウィンドウサイズにリサイズ
    let crtCache: CRTCache;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // リサイズ時にCRTキャッシュを再生成
      crtCache = createCRTCache(ctx, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    // Boidを初期化
    const boids: Boid[] = Array.from({ length: BOID_COUNT }, () =>
      new Boid(Math.random() * canvas.width, Math.random() * canvas.height)
    );

    // 捕食者を画面中央に1体生成
    const predator = new Predator(canvas.width / 2, canvas.height / 2);

    let animId: number = 0;

    const animate = () => {
      // 背景を黒でクリア
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 捕食者を更新
      predator.update(boids, canvas.width, canvas.height);

      // 各Boidを更新して描画
      for (const boid of boids) {
        boid.update(boids, predator, canvas.width, canvas.height);
        drawBoid(ctx, boid);
      }

      // 捕食者を描画
      drawPredator(ctx, predator);

      // CRTオーバーレイを重ねる
      drawCRTOverlay(ctx, crtCache, canvas.width, canvas.height);

      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="block"
      style={{ cursor: 'crosshair' }}
    />
  );
}

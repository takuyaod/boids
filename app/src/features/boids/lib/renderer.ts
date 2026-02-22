import type { Boid } from './Boid';
import type { Predator } from './Predator';

// 両レンダラーが実装する共通インターフェース
export interface BoidsRenderer {
  resize(width: number, height: number): void;
  render(boids: Boid[], predator: Predator): void;
  destroy(): void;
}

export type RendererType = 'webgpu' | 'canvas2d';

export type CreateRendererResult = {
  renderer: BoidsRenderer;
  type: RendererType;
};

// WebGPU 対応チェックと初期化を試み、失敗時は Canvas 2D にフォールバックする
export async function createRenderer(canvas: HTMLCanvasElement): Promise<CreateRendererResult> {
  if (typeof navigator !== 'undefined' && 'gpu' in navigator && navigator.gpu) {
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        console.warn('GPU アダプターを取得できません。ハードウェアが WebGPU をサポートしていないか、ドライバが古い可能性があります。Canvas 2D にフォールバックします');
      } else {
        try {
          const device = await adapter.requestDevice();
          const { WebGPURenderer } = await import('./webgpuRenderer');
          return { renderer: new WebGPURenderer(canvas, device), type: 'webgpu' };
        } catch (error) {
          console.warn(`GPU デバイスの初期化に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}。Canvas 2D にフォールバックします`);
        }
      }
    } catch (error) {
      console.warn(`GPU アダプターの取得に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}。Canvas 2D にフォールバックします`);
    }
  }
  const { Canvas2DRenderer } = await import('./canvas2DRenderer');
  return { renderer: new Canvas2DRenderer(canvas), type: 'canvas2d' };
}

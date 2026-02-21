import {
  CRT_SCANLINE_INTERVAL,
  CRT_SCANLINE_OPACITY,
  CRT_VIGNETTE_INNER_RADIUS,
  CRT_VIGNETTE_OUTER_RADIUS,
  CRT_VIGNETTE_OPACITY,
} from './constants';

// CRTエフェクトのキャッシュ（リサイズ時のみ再生成）
export type CRTCache = {
  scanlines: OffscreenCanvas;
  vignette: CanvasGradient;
};

// CRTオーバーレイのキャッシュを生成する（リサイズ時に呼び出す）
export function createCRTCache(ctx: CanvasRenderingContext2D, width: number, height: number): CRTCache {
  // スキャンラインをオフスクリーンCanvasに事前描画
  const scanlines = new OffscreenCanvas(width, height);
  const scanCtx = scanlines.getContext('2d');
  if (scanCtx) {
    scanCtx.fillStyle = `rgba(0, 0, 0, ${CRT_SCANLINE_OPACITY})`;
    for (let y = 0; y < height; y += CRT_SCANLINE_INTERVAL) {
      scanCtx.fillRect(0, y, width, 1);
    }
  }

  // ビネットグラデーションを生成
  const vignette = ctx.createRadialGradient(
    width / 2, height / 2, height * CRT_VIGNETTE_INNER_RADIUS,
    width / 2, height / 2, height * CRT_VIGNETTE_OUTER_RADIUS,
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, `rgba(0,0,0,${CRT_VIGNETTE_OPACITY})`);

  return { scanlines, vignette };
}

// CRTフィルターオーバーレイを描画する（毎フレーム呼び出す）
export function drawCRTOverlay(
  ctx: CanvasRenderingContext2D,
  cache: CRTCache,
  width: number,
  height: number,
): void {
  // スキャンライン（オフスクリーンCanvasから1回のdrawImageで転写）
  ctx.drawImage(cache.scanlines, 0, 0);

  // 画面端のビネット効果
  ctx.fillStyle = cache.vignette;
  ctx.fillRect(0, 0, width, height);
}

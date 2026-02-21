// エイリアンのピクセルアートスプライト（スペースインベーダー風）
export const ALIEN_SPRITE = [
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [1, 1, 0, 1, 1, 0, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [0, 1, 1, 0, 0, 1, 1, 0],
  [1, 0, 0, 1, 1, 0, 0, 1],
  [0, 1, 0, 0, 0, 0, 1, 0],
] as const satisfies ReadonlyArray<ReadonlyArray<0 | 1>>;

// ネオンカラーパレット
export const NEON_COLORS = ['#00ff41', '#00ffff', '#ff00ff'] as const;
export type NeonColor = typeof NEON_COLORS[number];

export const PIXEL_SIZE = 3;   // スプライトの1ピクセルのサイズ
export const BOID_COUNT = 60;  // Boidの数
export const MAX_SPEED = 2.0;  // 最大速度
export const MAX_FORCE = 0.04; // 最大操舵力

// 近傍範囲
export const SEPARATION_RADIUS = 35;
export const ALIGNMENT_RADIUS = 75;
export const COHESION_RADIUS = 75;

// 各ルールの重み
export const SEPARATION_WEIGHT = 1.8;
export const ALIGNMENT_WEIGHT = 1.0;
export const COHESION_WEIGHT = 1.0;

// CRTエフェクトのパラメータ
export const CRT_SCANLINE_INTERVAL = 3;       // スキャンライン間隔（px）
export const CRT_SCANLINE_OPACITY = 0.12;     // スキャンラインの不透明度
export const CRT_VIGNETTE_INNER_RADIUS = 0.35; // ビネット内径（画面高さ比）
export const CRT_VIGNETTE_OUTER_RADIUS = 0.85; // ビネット外径（画面高さ比）
export const CRT_VIGNETTE_OPACITY = 0.55;     // ビネット不透明度

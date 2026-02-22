// Boidの種別
export enum BoidSpecies {
  Sardine   = 'sardine',
  Squid     = 'squid',
  Octopus   = 'octopus',
  Crab      = 'crab',
  SeaTurtle = 'sea_turtle',
  Jellyfish = 'jellyfish',
  Manta     = 'manta',
}

// ── ピクセルアートスプライト定義（上方向が前方） ──────────────────────────

// イワシ（5×4）- 小型の流線型の魚
const SARDINE_SPRITE = [
  [0, 0, 1, 0, 0],
  [0, 1, 1, 1, 0],
  [1, 1, 1, 1, 1],
  [0, 1, 0, 1, 0],
] as const satisfies ReadonlyArray<ReadonlyArray<0 | 1>>;

// イカ（5×7）- 細長い胴体と長い触手
const SQUID_SPRITE = [
  [0, 0, 1, 0, 0],
  [0, 1, 1, 1, 0],
  [1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1],
  [0, 1, 1, 1, 0],
  [1, 0, 1, 0, 1],
  [0, 1, 0, 1, 0],
] as const satisfies ReadonlyArray<ReadonlyArray<0 | 1>>;

// タコ（7×6）- 丸い頭部と8本の触手
const OCTOPUS_SPRITE = [
  [0, 0, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1],
  [0, 1, 1, 1, 1, 1, 0],
  [1, 0, 1, 0, 1, 0, 1],
  [0, 1, 0, 1, 0, 1, 0],
] as const satisfies ReadonlyArray<ReadonlyArray<0 | 1>>;

// カニ（5×5）- 横幅のある体とハサミ
const CRAB_SPRITE = [
  [1, 0, 1, 0, 1],
  [0, 1, 1, 1, 0],
  [1, 1, 1, 1, 1],
  [0, 1, 1, 1, 0],
  [1, 0, 0, 0, 1],
] as const satisfies ReadonlyArray<ReadonlyArray<0 | 1>>;

// ウミガメ（5×6）- 楕円形の甲羅と4本のヒレ
const SEA_TURTLE_SPRITE = [
  [0, 1, 1, 1, 0],
  [1, 1, 1, 1, 1],
  [0, 1, 1, 1, 0],
  [0, 1, 1, 1, 0],
  [1, 1, 1, 1, 1],
  [0, 0, 1, 0, 0],
] as const satisfies ReadonlyArray<ReadonlyArray<0 | 1>>;

// クラゲ（5×7）- ドーム型の傘と垂れ下がる触手
const JELLYFISH_SPRITE = [
  [0, 1, 1, 1, 0],
  [1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1],
  [0, 1, 1, 1, 0],
  [1, 0, 1, 0, 1],
  [0, 1, 0, 1, 0],
  [0, 0, 1, 0, 0],
] as const satisfies ReadonlyArray<ReadonlyArray<0 | 1>>;

// マンタ（9×7）- 大型のひし形で優雅な翼
const MANTA_SPRITE = [
  [0, 0, 0, 0, 1, 0, 0, 0, 0],
  [0, 0, 0, 1, 1, 1, 0, 0, 0],
  [0, 0, 1, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 1, 1, 1, 0, 0, 0],
  [0, 0, 0, 0, 1, 0, 0, 0, 0],
] as const satisfies ReadonlyArray<ReadonlyArray<0 | 1>>;

// サメ（捕食者）（7×8）- 流線型のフォルムと胸びれ
export const SHARK_SPRITE = [
  [0, 0, 0, 1, 0, 0, 0],
  [0, 0, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1],
  [0, 0, 1, 1, 1, 0, 0],
  [0, 0, 1, 1, 1, 0, 0],
  [0, 1, 0, 1, 0, 1, 0],
  [1, 0, 0, 0, 0, 0, 1],
] as const satisfies ReadonlyArray<ReadonlyArray<0 | 1>>;

// ── 種別ごとの設定 ────────────────────────────────────────────────────────

// スプライト一覧
export const SPECIES_SPRITES: Record<BoidSpecies, ReadonlyArray<ReadonlyArray<0 | 1>>> = {
  [BoidSpecies.Sardine]:   SARDINE_SPRITE,
  [BoidSpecies.Squid]:     SQUID_SPRITE,
  [BoidSpecies.Octopus]:   OCTOPUS_SPRITE,
  [BoidSpecies.Crab]:      CRAB_SPRITE,
  [BoidSpecies.SeaTurtle]: SEA_TURTLE_SPRITE,
  [BoidSpecies.Jellyfish]: JELLYFISH_SPRITE,
  [BoidSpecies.Manta]:     MANTA_SPRITE,
};

// ネオンカラー（CRTモニター発光風）
export const SPECIES_COLORS: Record<BoidSpecies, `#${string}`> = {
  [BoidSpecies.Sardine]:   '#88ccff', // 銀青（イワシの鱗）
  [BoidSpecies.Squid]:     '#dd66ff', // 紫（イカの体色）
  [BoidSpecies.Octopus]:   '#ff8833', // オレンジ（タコの体色）
  [BoidSpecies.Crab]:      '#ff3311', // 赤（カニの甲羅）
  [BoidSpecies.SeaTurtle]: '#33ff99', // 緑（ウミガメの甲羅）
  [BoidSpecies.Jellyfish]: '#ff88ee', // ピンク（クラゲの透明感）
  [BoidSpecies.Manta]:     '#3388ff', // 深青（マンタの背面）
};

// 1スプライトピクセルあたりのCanvasピクセル数
export const SPECIES_PIXEL_SIZES: Record<BoidSpecies, number> = {
  [BoidSpecies.Sardine]:   2, // 最小（群れで映える）
  [BoidSpecies.Squid]:     3,
  [BoidSpecies.Octopus]:   3,
  [BoidSpecies.Crab]:      3,
  [BoidSpecies.SeaTurtle]: 4, // 大型でゆっくり
  [BoidSpecies.Jellyfish]: 3,
  [BoidSpecies.Manta]:     4, // 大型で優雅
};

// ── シミュレーション定数 ──────────────────────────────────────────────────

export const BOID_COUNT = 60;  // Boidの総数
export const MAX_SPEED = 2.0;  // 最大速度
export const MAX_FORCE = 0.04; // 最大操舵力

// 近傍範囲
export const SEPARATION_RADIUS = 35;
export const ALIGNMENT_RADIUS  = 75;
export const COHESION_RADIUS   = 75;

// 各ルールの重み
export const SEPARATION_WEIGHT = 1.8;
export const ALIGNMENT_WEIGHT  = 1.0;
export const COHESION_WEIGHT   = 1.0;

// 捕食者（サメ）定数
export const PREDATOR_COUNT      = 1;        // 捕食者の数
export const PREDATOR_PIXEL_SIZE = 5;        // サメのスプライトピクセルサイズ
export const PREDATOR_COLOR      = '#ff2200'; // 脅威を示す赤
export const PREDATOR_SPEED      = 2.8;      // 最大速度（Boidより速い）
export const PREDATOR_MAX_FORCE  = 0.05;     // 最大操舵力
export const PREDATOR_FLEE_RADIUS    = 160;              // Boidが逃げ始める距離
export const PREDATOR_FLEE_WEIGHT    = 3.5;              // 逃避力の重み
export const PREDATOR_FLEE_MAX_FORCE = MAX_FORCE * 4;   // 逃避時の最大操舵力
export const PREDATOR_EAT_RADIUS     = 15;               // 捕食判定の距離閾値

// ── CRTエフェクトのパラメータ ─────────────────────────────────────────────

export const CRT_SCANLINE_INTERVAL    = 3;    // スキャンライン間隔（px）
export const CRT_SCANLINE_OPACITY     = 0.12; // スキャンラインの不透明度
export const CRT_VIGNETTE_INNER_RADIUS = 0.35; // ビネット内径（画面高さ比）
export const CRT_VIGNETTE_OUTER_RADIUS = 0.85; // ビネット外径（画面高さ比）
export const CRT_VIGNETTE_OPACITY     = 0.55; // ビネット不透明度

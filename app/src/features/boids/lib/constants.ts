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

// クラゲ（7×7）- イカと区別しやすいよう幅広のドーム形傘と広がる触手
const JELLYFISH_SPRITE = [
  [0, 0, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1],
  [1, 0, 1, 0, 1, 0, 1],
  [0, 1, 0, 0, 0, 1, 0],
  [0, 0, 1, 0, 1, 0, 0],
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
  [BoidSpecies.Jellyfish]: '#44ddff', // シアン（クラゲの生物発光・イカの紫と区別）
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
export const MAX_SPEED = 2.0;  // デフォルト最大速度（種固有パラメータのスケール基準）
export const MAX_FORCE = 0.04; // デフォルト最大操舵力（種固有パラメータのスケール基準）

// ── 種固有のフロッキングパラメータ ───────────────────────────────────────

export type SpeciesParams = {
  maxSpeed: number;          // 最大速度
  maxForce: number;          // 最大操舵力
  separationRadius: number;  // 分離ルールの近傍半径
  separationWeight: number;  // 分離ルールの重み
  alignmentRadius: number;   // 整列ルールの近傍半径
  alignmentWeight: number;   // 整列ルールの重み
  cohesionRadius: number;    // 凝集ルールの近傍半径
  cohesionWeight: number;    // 凝集ルールの重み
  fleeWeight: number;        // 捕食者逃避の重み
  intraSpeciesBias: number;  // 同種ボイドへの整列・凝集の優先度倍率（1.0 = バイアスなし）
};

export const SPECIES_PARAMS: Record<BoidSpecies, SpeciesParams> = {
  // イワシ：密集したスクールを形成する小型魚
  [BoidSpecies.Sardine]: {
    maxSpeed: 2.0,   maxForce: 0.06,
    separationRadius: 28,  separationWeight: 1.8,
    alignmentRadius: 65,   alignmentWeight: 1.2,
    cohesionRadius: 65,    cohesionWeight: 1.5,
    fleeWeight: 4.5,       intraSpeciesBias: 8.0,
  },
  // イカ：小グループで行動する中型の頭足類
  [BoidSpecies.Squid]: {
    maxSpeed: 2.2,   maxForce: 0.04,
    separationRadius: 40,  separationWeight: 1.5,
    alignmentRadius: 60,   alignmentWeight: 0.7,
    cohesionRadius: 60,    cohesionWeight: 0.7,
    fleeWeight: 3.0,       intraSpeciesBias: 3.0,
  },
  // タコ：孤立傾向が強い知性的な頭足類
  // alignmentWeight/cohesionWeight が極めて小さいため、intraSpeciesBias は 1.0（バイアスなし）で十分な孤立行動を実現できる
  [BoidSpecies.Octopus]: {
    maxSpeed: 1.5,   maxForce: 0.03,
    separationRadius: 65,  separationWeight: 2.5,
    alignmentRadius: 50,   alignmentWeight: 0.15,
    cohesionRadius: 50,    cohesionWeight: 0.1,
    fleeWeight: 2.5,       intraSpeciesBias: 1.0,
  },
  // カニ：ゆっくりと移動する甲殻類
  [BoidSpecies.Crab]: {
    maxSpeed: 1.3,   maxForce: 0.03,
    separationRadius: 35,  separationWeight: 1.5,
    alignmentRadius: 50,   alignmentWeight: 0.5,
    cohesionRadius: 50,    cohesionWeight: 0.6,
    fleeWeight: 2.0,       intraSpeciesBias: 2.0,
  },
  // ウミガメ：独立行動で長距離を移動する爬虫類
  [BoidSpecies.SeaTurtle]: {
    maxSpeed: 1.4,   maxForce: 0.025,
    separationRadius: 50,  separationWeight: 1.2,
    alignmentRadius: 90,   alignmentWeight: 0.5,
    cohesionRadius: 90,    cohesionWeight: 0.4,
    fleeWeight: 1.5,       intraSpeciesBias: 1.5,
  },
  // クラゲ：受動的に漂う刺胞動物（捕食者をほぼ無視）
  [BoidSpecies.Jellyfish]: {
    maxSpeed: 0.9,   maxForce: 0.02,
    separationRadius: 45,  separationWeight: 0.8,
    alignmentRadius: 55,   alignmentWeight: 0.15,
    cohesionRadius: 55,    cohesionWeight: 0.15,
    fleeWeight: 0.5,       intraSpeciesBias: 1.0,
  },
  // マンタ：広い整列範囲で緩やかなループを描く大型魚
  [BoidSpecies.Manta]: {
    maxSpeed: 2.5,   maxForce: 0.03,
    separationRadius: 70,  separationWeight: 1.5,
    alignmentRadius: 130,  alignmentWeight: 1.0,
    cohesionRadius: 130,   cohesionWeight: 0.6,
    fleeWeight: 2.5,       intraSpeciesBias: 2.0,
  },
};

// 捕食者（サメ）定数
export const PREDATOR_COUNT      = 1;        // 捕食者の数
export const PREDATOR_PIXEL_SIZE = 5;        // サメのスプライトピクセルサイズ
export const PREDATOR_COLOR      = '#ff2200'; // 脅威を示す赤
export const PREDATOR_SPEED      = 2.8;      // 基本最大速度（Boidより速い）
export const PREDATOR_MAX_FORCE  = 0.05;     // 基本最大操舵力
export const PREDATOR_FLEE_RADIUS      = 160; // Boidが逃げ始める距離
export const PREDATOR_FLEE_FORCE_SCALE = 4;   // 逃避時の最大操舵力スケール（通常のmaxForceの倍率）
export const PREDATOR_EAT_RADIUS       = 15;  // 捕食判定の距離閾値

// 満腹度システムのデフォルト値
export const PREDATOR_SPEEDUP_THRESHOLD = 3;     // スピードアップが始まる捕食数
export const PREDATOR_OVERFED_THRESHOLD = 8;    // スピードダウンが始まる捕食数
export const PREDATOR_SATIETY_DECAY_RATE = 0.008; // フレームあたりの満腹度自然減少量
export const PREDATOR_SPEED_BOOST        = 1.5;  // スピードアップ時の速度倍率
export const PREDATOR_SPEED_PENALTY      = 0.5;  // スピードダウン時の速度倍率
// クラゲ捕食後の再捕食クールダウン時間（ミリ秒）
export const PREDATOR_JELLYFISH_COOLDOWN_MS = 12000;

// ── シミュレーションパラメータ（動的調整用） ──────────────────────────────

export type SimParams = {
  boidCount: number;
  maxSpeed: number;
  maxForce: number;
  predatorSpeedupThreshold: number;
  predatorOverfedThreshold: number;
  predatorSatietyDecayRate: number;
  predatorSpeedBoost: number;
  predatorSpeedPenalty: number;
};

export const DEFAULT_SIM_PARAMS: SimParams = {
  boidCount: BOID_COUNT,
  maxSpeed: MAX_SPEED,
  maxForce: MAX_FORCE,
  predatorSpeedupThreshold: PREDATOR_SPEEDUP_THRESHOLD,
  predatorOverfedThreshold: PREDATOR_OVERFED_THRESHOLD,
  predatorSatietyDecayRate: PREDATOR_SATIETY_DECAY_RATE,
  predatorSpeedBoost: PREDATOR_SPEED_BOOST,
  predatorSpeedPenalty: PREDATOR_SPEED_PENALTY,
};

// タコのスミ放出パラメータ
export const OCTOPUS_INK_PROBABILITY     = 0.01;  // フレームごとのスミ放出確率（サメが flee 範囲内のとき）
export const OCTOPUS_INK_COOLDOWN_MS     = 8000;  // スミ放出後のクールダウン（ミリ秒）
export const OCTOPUS_INK_CLOUD_DURATION_MS = 3000; // スミ雲エフェクトの表示時間（ミリ秒）
export const OCTOPUS_INK_CLOUD_MAX_RADIUS  = 55;   // スミ雲の最大半径（px）

// サメの混乱状態パラメータ
export const PREDATOR_CONFUSION_DURATION_MS               = 4000;     // 混乱持続時間（ミリ秒）
export const PREDATOR_CONFUSION_COLOR: `#${string}`       = '#ffffff'; // 混乱エフェクトの色（白）
export const PREDATOR_CONFUSION_DOT_COUNT                 = 4;        // 混乱エフェクトのドット数
export const PREDATOR_CONFUSION_DOT_ORBIT                 = 32;       // ドットの回転軌道半径（px）
export const PREDATOR_CONFUSION_DOT_RADIUS                = 3;        // ドットの描画半径（px）

// しびれエフェクトのパラメータ
export const PREDATOR_STUN_DURATION_MS  = 3000;      // しびれ持続時間（ミリ秒）
export const PREDATOR_STUN_DOT_COUNT    = 6;         // しびれエフェクトのドット数
export const PREDATOR_STUN_DOT_ORBIT    = 28;        // ドットの回転軌道半径（px）
export const PREDATOR_STUN_DOT_RADIUS   = 3;         // ドットの描画半径（px）
export const PREDATOR_STUN_ORBIT_WOBBLE = 4;         // 軌道半径の振動幅（px）しびれ感を演出
export const PREDATOR_STUN_COLOR: `#${string}` = '#ffee00'; // しびれエフェクトの色（黄色）

// ── CRTエフェクトのパラメータ ─────────────────────────────────────────────

export const CRT_SCANLINE_INTERVAL    = 3;    // スキャンライン間隔（px）
export const CRT_SCANLINE_OPACITY     = 0.12; // スキャンラインの不透明度
export const CRT_VIGNETTE_INNER_RADIUS = 0.35; // ビネット内径（画面高さ比）
export const CRT_VIGNETTE_OUTER_RADIUS = 0.85; // ビネット外径（画面高さ比）
export const CRT_VIGNETTE_OPACITY     = 0.55; // ビネット不透明度

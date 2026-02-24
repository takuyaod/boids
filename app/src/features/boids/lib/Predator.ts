import { Boid } from './Boid';
import {
  BoidSpecies,
  PREDATOR_SPEED,
  PREDATOR_MAX_FORCE,
  PREDATOR_EAT_RADIUS,
  PREDATOR_STUN_DURATION_MS,
  PREDATOR_JELLYFISH_COOLDOWN_MS,
  PREDATOR_CONFUSION_ANGLE_CHANGE_INTERVAL_MS,
} from './constants';
import { Vec2, magnitude, normalize, limit } from './vec2';

// 満腹度システムのパラメータ型（update() の引数を型安全にまとめる）
export type SatietyParams = {
  speedupThreshold: number;
  overfedThreshold: number;
  satietyDecayRate: number;
  speedBoost: number;
  speedPenalty: number;
};

export class Predator {
  x: number;
  y: number;
  vx: number;
  vy: number;
  // 満腹度（外部からの書き込みを防ぐためプライベートフィールド + ゲッターで管理）
  private _satiety: number;
  // しびれ終了時刻（performance.now() ベース。0 = しびれなし）
  private _stunnedUntil: number;
  // 混乱終了時刻（performance.now() ベース。0 = 混乱なし）
  private _confusedUntil: number;
  // 混乱中の現在進行方向（ランダム角度。毎フレーム変えると力が打ち消し合うため保持する）
  private _confusionAngle: number;
  // 混乱方向を次に更新するタイムスタンプ
  private _confusionAngleChangedAt: number;
  // クラゲ捕食後の再捕食クールダウン終了時刻（0 = クールダウンなし）
  private _jellyfishCooldownUntil: number;

  get satiety(): number {
    return this._satiety;
  }

  // 現在しびれ状態かどうか
  get isStunned(): boolean {
    return performance.now() < this._stunnedUntil;
  }

  // 現在混乱状態かどうか（しびれ中は混乱を無効化）
  // _stunnedUntil の初期値は 0 のため、未しびれ状態では now >= 0 が常に true となり混乱判定が有効になる
  get isConfused(): boolean {
    const now = performance.now();
    return now < this._confusedUntil && now >= this._stunnedUntil;
  }

  // 外部からサメを混乱状態にする（タコのスミ放出から呼び出す）
  confuse(durationMs: number): void {
    const now = performance.now();
    this._confusedUntil = now + durationMs;
    // 混乱開始時に即座に新しいランダム方向を設定する
    this._confusionAngle = Math.random() * Math.PI * 2;
    this._confusionAngleChangedAt = now;
  }

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this._satiety = 0;
    this._stunnedUntil = 0;
    this._confusedUntil = 0;
    this._confusionAngle = 0;
    this._confusionAngleChangedAt = 0;
    this._jellyfishCooldownUntil = 0;
    // 初期速度は定数 PREDATOR_SPEED を使用（スポーン時点では動的パラメータを参照しない設計）
    const angle = Math.random() * Math.PI * 2;
    this.vx = Math.cos(angle) * PREDATOR_SPEED;
    this.vy = Math.sin(angle) * PREDATOR_SPEED;
  }

  // ラップアラウンドを考慮したBoidへの相対位置ベクトルを返す
  private wrappedDelta(boid: Boid, width: number, height: number): Vec2 {
    let dx = boid.x - this.x;
    if (Math.abs(dx) > width / 2) dx -= Math.sign(dx) * width;
    let dy = boid.y - this.y;
    if (Math.abs(dy) > height / 2) dy -= Math.sign(dy) * height;
    return { x: dx, y: dy };
  }

  // 1回の走査で最も近いBoidへの追尾力と捕食対象を同時に計算する（重複距離計算を排除）
  private scanBoids(
    boids: Boid[],
    width: number,
    height: number,
    effectiveSpeed: number,
    effectiveMaxForce: number,
    skipJellyfish: boolean,
  ): { steer: Vec2; eaten: Set<Boid> } {
    if (boids.length === 0) return { steer: { x: 0, y: 0 }, eaten: new Set() };

    let nearest: Boid | null = null;
    let nearestDelta: Vec2 = { x: 0, y: 0 };
    let minDist = Infinity;
    const eaten = new Set<Boid>();

    for (const boid of boids) {
      // クールダウン中はクラゲをスキップ（per-frame filter 生成を避けるためループ内で判定）
      if (skipJellyfish && boid.species === BoidSpecies.Jellyfish) continue;
      const delta = this.wrappedDelta(boid, width, height);
      const dist = magnitude(delta.x, delta.y);
      // 最も近いBoidを追跡（最近傍探索）
      if (dist < minDist) {
        minDist = dist;
        nearest = boid;
        nearestDelta = delta;
      }
      // 捕食範囲内のBoidを収集
      if (dist < PREDATOR_EAT_RADIUS) {
        eaten.add(boid);
      }
    }

    let steer: Vec2 = { x: 0, y: 0 };
    if (nearest) {
      // 目標に向かうステアリング力を計算（ラップアラウンド考慮の最短方向）
      const norm = normalize(nearestDelta.x, nearestDelta.y);
      steer = limit(
        norm.x * effectiveSpeed - this.vx,
        norm.y * effectiveSpeed - this.vy,
        effectiveMaxForce,
      );
    }

    return { steer, eaten };
  }

  // 位置・速度を更新し、捕食されたBoidの集合を返す（満腹度に基づく速度動的変化）
  update(
    boids: Boid[],
    width: number,
    height: number,
    satietyParams: SatietyParams,
  ): Set<Boid> {
    const now = performance.now();
    const { speedupThreshold, overfedThreshold, satietyDecayRate, speedBoost, speedPenalty } = satietyParams;

    // 満腹度に基づく速度倍率を計算
    // overfedThreshold 以上 → お腹いっぱいで鈍化
    // speedupThreshold 以上 → 興奮状態でスピードアップ
    // それ以外 → 通常速度
    let speedMultiplier = 1.0;
    if (this._satiety >= overfedThreshold) {
      speedMultiplier = speedPenalty;
    } else if (this._satiety >= speedupThreshold) {
      speedMultiplier = speedBoost;
    }

    const effectiveSpeed    = PREDATOR_SPEED    * speedMultiplier;
    const effectiveMaxForce = PREDATOR_MAX_FORCE * speedMultiplier;

    // 1回の走査で追尾力と捕食対象を計算（chase/eat の重複計算を統合）
    // しびれ中も捕食スキャンは実行する（停止中にクラゲと接触した場合もしびれ時間をリセットする仕様）
    // クールダウン中はクラゲをスキャン内でスキップ（per-frame filter 生成によるGC圧を回避）
    const skipJellyfish = now < this._jellyfishCooldownUntil;
    const { steer, eaten } = this.scanBoids(boids, width, height, effectiveSpeed, effectiveMaxForce, skipJellyfish);

    // クラゲを捕食したらしびれ状態とクールダウンをセット（満腹度は加算しない）
    for (const boid of eaten) {
      if (boid.species === BoidSpecies.Jellyfish) {
        this._stunnedUntil = now + PREDATOR_STUN_DURATION_MS;
        this._jellyfishCooldownUntil = now + PREDATOR_JELLYFISH_COOLDOWN_MS;
        break;
      }
    }

    if (now < this._stunnedUntil) {
      // しびれ中は速度をゼロにして移動しない
      this.vx = 0;
      this.vy = 0;
    } else {
      // 混乱中は追跡をやめてランダム方向にステアリング
      // 毎フレームランダムにすると力が打ち消し合うため、一定間隔ごとに方向を更新する
      let activeSteer = steer;
      if (now < this._confusedUntil) {
        if (now - this._confusionAngleChangedAt > PREDATOR_CONFUSION_ANGLE_CHANGE_INTERVAL_MS) {
          this._confusionAngle = Math.random() * Math.PI * 2;
          this._confusionAngleChangedAt = now;
        }
        activeSteer = limit(
          Math.cos(this._confusionAngle) * effectiveSpeed - this.vx,
          Math.sin(this._confusionAngle) * effectiveSpeed - this.vy,
          effectiveMaxForce,
        );
      }

      this.vx += activeSteer.x;
      this.vy += activeSteer.y;

      const vel = limit(this.vx, this.vy, effectiveSpeed);
      this.vx = vel.x;
      this.vy = vel.y;

      this.x += this.vx;
      this.y += this.vy;

      // 画面端でラップアラウンド
      if (this.x < 0) this.x += width;
      if (this.x > width) this.x -= width;
      if (this.y < 0) this.y += height;
      if (this.y > height) this.y -= height;
    }

    // クラゲ以外の捕食のみ満腹度を増加（クラゲは栄養にならない）
    for (const boid of eaten) {
      if (boid.species !== BoidSpecies.Jellyfish) {
        this._satiety += 1;
      }
    }
    // 満腹度を自然減少（最小値は 0）
    this._satiety = Math.max(0, this._satiety - satietyDecayRate);

    return eaten;
  }
}

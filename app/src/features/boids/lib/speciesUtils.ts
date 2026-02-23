import { BoidSpecies } from './constants';

// 種別ごとの個体数を表す型
export type SpeciesCounts = Record<BoidSpecies, number>;

// 全種別のカウントが 0 の初期オブジェクトを生成する
export function createEmptySpeciesCounts(): SpeciesCounts {
  return Object.fromEntries(
    Object.values(BoidSpecies).map(s => [s, 0])
  ) as SpeciesCounts;
}

// ランダム割り当て時の重み（イワシを多めに）
const SPECIES_WEIGHT_TABLE = [
  [BoidSpecies.Sardine,   35],
  [BoidSpecies.Squid,     15],
  [BoidSpecies.Octopus,   10],
  [BoidSpecies.Crab,      10],
  [BoidSpecies.SeaTurtle, 10],
  [BoidSpecies.Jellyfish, 10],
  [BoidSpecies.Manta,     10],
] as const satisfies ReadonlyArray<readonly [BoidSpecies, number]>;

// 重みの合計を事前計算（浮動小数点精度誤差対策のフォールバックにも使用）
const SPECIES_TOTAL_WEIGHT = SPECIES_WEIGHT_TABLE.reduce((sum, [, w]) => sum + w, 0);

// 重み付きランダムで種を選ぶ
export function getRandomSpecies(): BoidSpecies {
  let r = Math.random() * SPECIES_TOTAL_WEIGHT;
  for (const [species, weight] of SPECIES_WEIGHT_TABLE) {
    r -= weight;
    if (r <= 0) return species;
  }
  // 浮動小数点精度誤差でループを抜けた場合のフォールバック
  return BoidSpecies.Sardine;
}

// 各種の最低保証個体数（この数を下回る種は優先スポーン）
const MIN_SPECIES_COUNT = 2;
// イワシの最大比率上限（この比率を超えるとスポーン対象から除外）
const MAX_SARDINE_RATIO = 0.5;

// バランスを考慮してスポーンする種を決定する
// 優先度：① 2体未満の種 → ② イワシ上限チェック → ③ 通常の重み付きランダム
export function getSpawnSpecies(currentCounts: SpeciesCounts, totalBoids: number): BoidSpecies {
  // ① 最低個体数を下回る種があれば優先スポーン
  const endangered = (Object.values(BoidSpecies) as BoidSpecies[]).filter(s => currentCounts[s] < MIN_SPECIES_COUNT);
  if (endangered.length > 0) {
    return endangered[Math.floor(Math.random() * endangered.length)];
  }

  // ② イワシが上限比率を超えていれば除外して重み付きランダム
  const sardineRatio = totalBoids > 0 ? currentCounts[BoidSpecies.Sardine] / totalBoids : 0;
  if (sardineRatio >= MAX_SARDINE_RATIO) {
    const filteredTable = SPECIES_WEIGHT_TABLE.filter(([s]) => s !== BoidSpecies.Sardine);
    const totalWeight = filteredTable.reduce((sum, [, w]) => sum + w, 0);
    let r = Math.random() * totalWeight;
    for (const [species, weight] of filteredTable) {
      r -= weight;
      if (r <= 0) return species;
    }
    // filteredTable は常に全種別（イワシを除く）を含むため空にならない
    return filteredTable[filteredTable.length - 1][0];
  }

  // ③ 通常の重み付きランダム
  return getRandomSpecies();
}

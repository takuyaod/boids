import { BoidSpecies } from './constants';

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

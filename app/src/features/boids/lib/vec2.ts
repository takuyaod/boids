export type Vec2 = { x: number; y: number };

// ベクトルの大きさを計算
export function magnitude(x: number, y: number): number {
  return Math.sqrt(x * x + y * y);
}

// ベクトルを正規化
export function normalize(x: number, y: number): Vec2 {
  const mag = magnitude(x, y);
  if (mag === 0) return { x: 0, y: 0 };
  return { x: x / mag, y: y / mag };
}

// ベクトルの大きさを最大値に制限
export function limit(x: number, y: number, max: number): Vec2 {
  const mag = magnitude(x, y);
  if (mag > max) {
    const scale = max / mag;
    return { x: x * scale, y: y * scale };
  }
  return { x, y };
}

import { Boid } from './Boid';

// 画面端のランダムな位置にcount体のBoidを生成して返す
export function spawnBoidsAtEdge(count: number, width: number, height: number): Boid[] {
  const newBoids: Boid[] = [];
  for (let i = 0; i < count; i++) {
    // 0:上, 1:下, 2:左, 3:右
    const edge = Math.floor(Math.random() * 4);
    let nx: number, ny: number;
    if (edge === 0)      { nx = Math.random() * width;  ny = 0; }
    else if (edge === 1) { nx = Math.random() * width;  ny = height; }
    else if (edge === 2) { nx = 0;                      ny = Math.random() * height; }
    else                 { nx = width;                  ny = Math.random() * height; }
    newBoids.push(new Boid(nx, ny));
  }
  return newBoids;
}

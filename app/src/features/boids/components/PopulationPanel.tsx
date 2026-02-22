'use client';

import { useEffect, useRef } from 'react';
import type { SpeciesCounts } from '../lib/speciesUtils';
import {
  BoidSpecies,
  SPECIES_SPRITES,
  SPECIES_COLORS,
  SHARK_SPRITE,
  PREDATOR_COLOR,
} from '../lib/constants';

type PopulationPanelProps = {
  counts: SpeciesCounts;
  sharkCount: number;
};

// スプライト描画用の定数（HUD アイコン用）
const ICON_PIXEL_SIZE = 2;
const ICON_CANVAS_SIZE = 22;

// 表示順と表示名を定義
const SPECIES_DISPLAY_ORDER: ReadonlyArray<{
  species: BoidSpecies;
  label: string;
}> = [
  { species: BoidSpecies.Sardine, label: 'sardine' },
  { species: BoidSpecies.Squid, label: 'squid' },
  { species: BoidSpecies.Octopus, label: 'octopus' },
  { species: BoidSpecies.Crab, label: 'crab' },
  { species: BoidSpecies.SeaTurtle, label: 'turtle' },
  { species: BoidSpecies.Jellyfish, label: 'jellyfish' },
  { species: BoidSpecies.Manta, label: 'manta' },
];

// Canvas にスプライトを描画する（キャンバス中央に配置）
function drawSpriteIcon(
  ctx: CanvasRenderingContext2D,
  sprite: ReadonlyArray<ReadonlyArray<0 | 1>>,
  color: string
): void {
  if (sprite.length === 0) return;

  ctx.clearRect(0, 0, ICON_CANVAS_SIZE, ICON_CANVAS_SIZE);
  ctx.fillStyle = color;
  ctx.shadowBlur = 6;
  ctx.shadowColor = color;

  const spriteW = sprite[0].length * ICON_PIXEL_SIZE;
  const spriteH = sprite.length * ICON_PIXEL_SIZE;
  const offsetX = Math.floor((ICON_CANVAS_SIZE - spriteW) / 2);
  const offsetY = Math.floor((ICON_CANVAS_SIZE - spriteH) / 2);

  for (let row = 0; row < sprite.length; row++) {
    for (let col = 0; col < sprite[row].length; col++) {
      if (sprite[row][col] === 1) {
        ctx.fillRect(
          offsetX + col * ICON_PIXEL_SIZE,
          offsetY + row * ICON_PIXEL_SIZE,
          ICON_PIXEL_SIZE,
          ICON_PIXEL_SIZE
        );
      }
    }
  }
}

// スプライトアイコンコンポーネント（species か isShark のどちらか一方を必須とする）
type SpriteIconProps =
  | { species: BoidSpecies; isShark?: never }
  | { species?: never; isShark: true };

function SpriteIcon({ species, isShark }: SpriteIconProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (isShark) {
      drawSpriteIcon(ctx, SHARK_SPRITE, PREDATOR_COLOR);
    } else if (species) {
      const sprite = SPECIES_SPRITES[species];
      const color = SPECIES_COLORS[species];
      drawSpriteIcon(ctx, sprite, color);
    }
  }, [species, isShark]);

  return (
    <canvas
      ref={canvasRef}
      width={ICON_CANVAS_SIZE}
      height={ICON_CANVAS_SIZE}
      className="shrink-0"
    />
  );
}

export default function PopulationPanel({
  counts,
  sharkCount,
}: PopulationPanelProps) {
  return (
    <div className="w-44 shrink-0 border-l border-[#333] font-mono text-xs bg-[#0d0d0d] flex flex-col">
      {/* ヘッダー */}
      <div className="px-3 py-2 border-b border-[#333] text-[#555]">
        ┌─ POPULATION ─
      </div>

      {/* Boid種別の行 */}
      <div className="flex-1 px-3 py-2 flex flex-col gap-1.5 overflow-y-auto">
        {SPECIES_DISPLAY_ORDER.map(({ species, label }) => (
          <div key={species} className="flex items-center gap-2">
            <SpriteIcon species={species} />
            <span className="flex-1 text-[#888] truncate">{label}</span>
            <span style={{ color: SPECIES_COLORS[species] }} className="shrink-0">
              {counts[species]}
            </span>
          </div>
        ))}
      </div>

      {/* セパレーター + サメの行 */}
      <div className="border-t border-[#333] px-3 py-2">
        <div className="flex items-center gap-2">
          <SpriteIcon isShark />
          <span className="flex-1 text-[#888] truncate">shark</span>
          <span style={{ color: PREDATOR_COLOR }} className="shrink-0">
            {sharkCount}
          </span>
        </div>
      </div>
    </div>
  );
}

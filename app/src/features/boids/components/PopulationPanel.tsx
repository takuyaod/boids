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
import Tooltip from './Tooltip';

type PopulationPanelProps = {
  counts: SpeciesCounts;
  sharkCount: number;
};

// スプライト描画用の定数（HUD アイコン用）
const ICON_PIXEL_SIZE = 2;
const ICON_CANVAS_SIZE = 22;

// 表示順と表示名、ツールチップを定義
const SPECIES_DISPLAY_ORDER: ReadonlyArray<{
  species: BoidSpecies;
  label: string;
  tooltip: string;
}> = [
  {
    species: BoidSpecies.Sardine,
    label: 'sardine',
    tooltip: '[イワシ] 密集スクールを形成。同種への凝集力が高く（bias: 8.0）、捕食者への逃避反応も非常に強い（flee: 4.5）',
  },
  {
    species: BoidSpecies.Squid,
    label: 'squid',
    tooltip: '[イカ] 小グループで移動。中程度の凝集力・逃避力（flee: 3.0）',
  },
  {
    species: BoidSpecies.Octopus,
    label: 'octopus',
    tooltip: '[タコ] 孤立傾向。分離半径が大きく（65）、整列・凝集がほぼゼロ。ゆっくり単独行動。サメが接近時にスミを放出し 4 秒間混乱させる固有能力（確率 1%/frame、CD 8 秒）',
  },
  {
    species: BoidSpecies.Crab,
    label: 'crab',
    tooltip: '[カニ] 最も遅い種。逃避力が弱く（flee: 2.0）、捕食者への反応が鈍い',
  },
  {
    species: BoidSpecies.SeaTurtle,
    label: 'turtle',
    tooltip: '[ウミガメ] ゆったりと独立行動。整列・凝集が弱く、個体間の距離を広く保つ',
  },
  {
    species: BoidSpecies.Jellyfish,
    label: 'jellyfish',
    tooltip: '[クラゲ] 受動的に漂う最遅種。捕食者への反応がほぼゼロ（flee: 0.5）。サメに食べられるとサメを 3 秒間スタンさせ、12 秒間クールダウンを発動',
  },
  {
    species: BoidSpecies.Manta,
    label: 'manta',
    tooltip: '[マンタ] 最も速い種。広い範囲で緩やかなグループを形成',
  },
];

// サメのツールチップ
const SHARK_TOOLTIP = '[サメ] 捕食者。満腹度に応じてスピードが変化：空腹時加速・過食時減速';

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
    <div className="font-mono text-xs bg-[#0d0d0d] flex flex-col flex-1 min-h-0">
      {/* ヘッダー */}
      <div className="px-3 py-2 border-b border-[#333] text-[#555]">
        ┌─ POPULATION ─
      </div>

      {/* Boid種別の行 */}
      <div className="flex-1 px-3 py-2 flex flex-col gap-1.5 overflow-y-auto">
        {SPECIES_DISPLAY_ORDER.map(({ species, label, tooltip }) => (
          <Tooltip key={species} content={tooltip}>
            <div className="flex items-center gap-2 cursor-default">
              <SpriteIcon species={species} />
              <span className="flex-1 text-[#888] truncate">{label}</span>
              <span style={{ color: SPECIES_COLORS[species] }} className="shrink-0">
                {counts[species]}
              </span>
            </div>
          </Tooltip>
        ))}
      </div>

      {/* セパレーター + サメの行 */}
      <div className="border-t border-[#333] px-3 py-2">
        <Tooltip content={SHARK_TOOLTIP}>
          <div className="flex items-center gap-2 cursor-default">
            <SpriteIcon isShark />
            <span className="flex-1 text-[#888] truncate">shark</span>
            <span style={{ color: PREDATOR_COLOR }} className="shrink-0">
              {sharkCount}
            </span>
          </div>
        </Tooltip>
      </div>
    </div>
  );
}

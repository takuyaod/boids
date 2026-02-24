'use client';

import { memo } from 'react';
import type { SimParams } from '../lib/constants';
import Tooltip from './Tooltip';

type ParamsPanelProps = {
  params: SimParams;
  onChange: (params: SimParams) => void;
  // 読み取り専用の状態表示（操作UIとモニタリング表示を型で明示）
  readonlyStats?: { satiety: number };
};

// スライダー1行分のコンポーネント
type SliderRowProps = {
  label: string;
  tooltip: string;
  value: number;
  min: number;
  max: number;
  step: number;
  color: string;
  display: string;
  onChange: (value: number) => void;
};

function SliderRow({ label, tooltip, value, min, max, step, color, display, onChange }: SliderRowProps) {
  return (
    <Tooltip content={tooltip}>
      <div className="flex flex-col gap-0.5 cursor-default">
        <div className="flex justify-between items-center">
          <span className="text-[#666] text-[10px]">{label}</span>
          <span className="text-[10px] shrink-0" style={{ color }}>{display}</span>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-runnable-track]:h-px [&::-webkit-slider-runnable-track]:bg-[#444] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:-mt-0.75 [&::-moz-range-track]:h-px [&::-moz-range-track]:bg-[#444] [&::-moz-range-thumb]:w-2 [&::-moz-range-thumb]:h-2 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0"
          style={{ '--thumb-color': color, color } as React.CSSProperties}
        />
      </div>
    </Tooltip>
  );
}

// 読み取り専用の数値表示行（satiety など）
type ReadonlyRowProps = {
  label: string;
  tooltip: string;
  display: string;
  color: string;
};

function ReadonlyRow({ label, tooltip, display, color }: ReadonlyRowProps) {
  return (
    <Tooltip content={tooltip}>
      <div className="flex justify-between items-center cursor-default">
        <span className="text-[#666] text-[10px]">{label}</span>
        <span className="text-[10px] shrink-0" style={{ color }}>{display}</span>
      </div>
    </Tooltip>
  );
}

const ParamsPanel = memo(function ParamsPanel({ params, onChange, readonlyStats }: ParamsPanelProps) {
  const satiety = readonlyStats?.satiety ?? 0;

  return (
    <div className="font-mono text-xs bg-[#0d0d0d] flex flex-col border-t border-[#333]">
      {/* ヘッダー */}
      <div className="px-3 py-2 border-b border-[#333] text-[#555]">
        ├─ PARAMS ─
      </div>

      {/* Boid パラメータ */}
      <div className="px-3 py-2 flex flex-col gap-2.5">
        <SliderRow
          label="boid_count"
          tooltip="各種ボイドの初期個体数。変更するとシミュレーションをリセット"
          value={params.boidCount}
          min={10}
          max={200}
          step={1}
          color="#00ff41"
          display={String(params.boidCount)}
          onChange={(v) => onChange({ ...params, boidCount: v })}
        />
        <SliderRow
          label="max_speed"
          tooltip="ボイド全種の最高速度の倍率（種固有の値にこの倍率をかける）"
          value={params.maxSpeed}
          min={0.5}
          max={5.0}
          step={0.1}
          color="#00ff41"
          display={params.maxSpeed.toFixed(1)}
          onChange={(v) => onChange({ ...params, maxSpeed: v })}
        />
        <SliderRow
          label="max_force"
          tooltip="ボイド全種の最大操舵力の倍率（向き変更の素早さに影響）"
          value={params.maxForce}
          min={0.01}
          max={0.20}
          step={0.01}
          color="#00ff41"
          display={params.maxForce.toFixed(2)}
          onChange={(v) => onChange({ ...params, maxForce: v })}
        />
      </div>

      {/* 捕食者セクション */}
      <div className="border-t border-[#333] px-3 py-2 flex flex-col gap-2.5">
        <div className="text-[#555] text-[10px]">── PREDATOR</div>

        {/* 満腹度（読み取り専用表示） */}
        <ReadonlyRow
          label="satiety"
          tooltip="サメの現在の満腹度。捕食するごとに増加し、時間とともに減少"
          display={satiety.toFixed(1)}
          color="#ff2200"
        />

        <SliderRow
          label="speedup_threshold"
          tooltip="満腹度がこの値を超えるとサメが加速する閾値"
          value={params.predatorSpeedupThreshold}
          min={1}
          max={15}
          step={1}
          color="#ff6600"
          display={String(params.predatorSpeedupThreshold)}
          onChange={(v) => {
            // speedupThreshold が overfedThreshold 以上にならないよう連動して調整
            const newOverfed = v >= params.predatorOverfedThreshold
              ? v + 1
              : params.predatorOverfedThreshold;
            onChange({ ...params, predatorSpeedupThreshold: v, predatorOverfedThreshold: newOverfed });
          }}
        />
        <SliderRow
          label="overfed_threshold"
          tooltip="満腹度がこの値を超えるとサメが減速する（過食）閾値"
          value={params.predatorOverfedThreshold}
          min={2}
          max={20}
          step={1}
          color="#ff6600"
          display={String(params.predatorOverfedThreshold)}
          onChange={(v) => {
            // overfedThreshold が speedupThreshold 以下にならないよう連動して調整
            const newSpeedup = v <= params.predatorSpeedupThreshold
              ? v - 1
              : params.predatorSpeedupThreshold;
            onChange({ ...params, predatorOverfedThreshold: v, predatorSpeedupThreshold: newSpeedup });
          }}
        />
        <SliderRow
          label="satiety_decay_rate"
          tooltip="毎フレームの満腹度の減少量。大きいほど空腹になりやすい"
          value={params.predatorSatietyDecayRate}
          min={0.001}
          max={0.020}
          step={0.001}
          color="#ff6600"
          display={params.predatorSatietyDecayRate.toFixed(3)}
          onChange={(v) => onChange({ ...params, predatorSatietyDecayRate: v })}
        />
        <SliderRow
          label="speed_boost"
          tooltip="空腹時（speedup_threshold 超）のサメの速度倍率"
          value={params.predatorSpeedBoost}
          min={1.0}
          max={3.0}
          step={0.1}
          color="#ff6600"
          display={params.predatorSpeedBoost.toFixed(1)}
          onChange={(v) => onChange({ ...params, predatorSpeedBoost: v })}
        />
        <SliderRow
          label="speed_penalty"
          tooltip="過食時（overfed_threshold 超）のサメの速度倍率"
          value={params.predatorSpeedPenalty}
          min={0.1}
          max={0.9}
          step={0.1}
          color="#ff6600"
          display={params.predatorSpeedPenalty.toFixed(1)}
          onChange={(v) => onChange({ ...params, predatorSpeedPenalty: v })}
        />
      </div>
    </div>
  );
});

export default ParamsPanel;

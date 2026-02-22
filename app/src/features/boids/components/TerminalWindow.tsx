import BoidsCanvas from './BoidsCanvas';
import { BOID_COUNT, PREDATOR_COUNT } from '../lib/constants';

export default function TerminalWindow() {
  return (
    // ページ全体：暗いグレー背景
    <div className="min-h-screen bg-[#111111] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* ターミナルウィンドウ本体 */}
      <div
        className="w-full max-w-5xl flex flex-col border border-[#444] rounded-lg overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.8)]"
        style={{ height: 'min(90vh, 760px)' }}
      >
        {/* ── ウィンドウクローム：タイトルバーのみ ── */}
        <div className="flex items-center gap-3 px-4 py-3 bg-[#252525] border-b border-[#444] shrink-0">
          {/* macOS 風トラフィックライト */}
          <div className="flex gap-1.5 shrink-0">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          {/* ウィンドウタイトル */}
          <span className="font-mono text-sm text-[#666]">boids — swarm</span>
        </div>

        {/* ── ターミナル本文 ── */}
        <div className="flex-1 min-h-0 flex flex-col bg-[#0d0d0d]">
          {/* プロンプト＋コマンド行：実際にコマンドを打った雰囲気 */}
          <div className="px-4 pt-3 pb-2.5 border-b border-[#1e1e1e] shrink-0 font-mono text-xs leading-relaxed">
            {/* プロンプト行 */}
            <div className="flex items-center gap-2">
              <span className="text-[#e8a046]">swarm</span>
              <span className="text-[#888]">~/boids</span>
              <span className="text-[#6eb3e8]">main ✦</span>
            </div>
            {/* 入力されたコマンド */}
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[#00ff41]">❯</span>
              <span className="text-[#ddd]">
                spawn --creatures {BOID_COUNT} --sharks {PREDATOR_COUNT}
              </span>
            </div>
            {/* コマンドの出力 */}
            <div className="mt-1 text-[#666]">
              Spawning {BOID_COUNT} ocean creatures and {PREDATOR_COUNT} shark into the depths...
            </div>
          </div>

          {/* キャンバスエリア */}
          <div className="flex-1 min-h-0 relative overflow-hidden bg-black">
            <BoidsCanvas />
          </div>
        </div>

        {/* ── フッター：ステータス ── */}
        <div className="px-4 py-2.5 bg-[#1a1a1a] border-t border-[#333] shrink-0 font-mono text-xs">
          <div className="flex gap-4 text-[#555]">
            <span>
              creatures:{' '}
              <span className="text-[#00ff41]">{BOID_COUNT}</span>
            </span>
            <span>
              sharks:{' '}
              <span className="text-[#ff2200]">{PREDATOR_COUNT}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useRef, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type TooltipProps = {
  content: string;
  children: ReactNode;
};

// ホバー要素とツールチップ右端の間隔（px）
const TOOLTIP_OFFSET = 8;
// ホバー表示遅延（ms）
const HOVER_DELAY_MS = 250;

export default function Tooltip({ content, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const showTooltip = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      if (!wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      // ツールチップを要素の左側に表示
      setPos({
        top: rect.top + rect.height / 2,
        left: rect.left - TOOLTIP_OFFSET,
      });
      setVisible(true);
    }, HOVER_DELAY_MS);
  }, []);

  const hideTooltip = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setVisible(false);
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="relative w-full"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
    >
      {children}
      {visible &&
        createPortal(
          <div
            role="tooltip"
            className="fixed z-50 pointer-events-none font-mono text-[10px] leading-relaxed"
            style={{
              top: pos.top,
              left: pos.left,
              transform: 'translate(-100%, -50%)',
              maxWidth: '240px',
            }}
          >
            {/* CRT テーマのツールチップ */}
            <div
              className="border border-[#333] px-2 py-1.5"
              style={{
                background: '#111',
                color: '#aaa',
                boxShadow: '0 0 8px rgba(0,255,65,0.15)',
              }}
            >
              {content}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

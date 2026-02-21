import BoidsCanvas from '@/components/BoidsCanvas';

export default function Home() {
  return (
    // 全画面の黒背景にキャンバスを配置
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      <BoidsCanvas />
      {/* タイトルオーバーレイ */}
      <div
        className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{ fontFamily: 'var(--font-press-start-2p)', fontSize: '1rem' }}
      >
        <span style={{ color: '#00ff41', textShadow: '0 0 10px #00ff41, 0 0 20px #00ff41' }}>
          BOIDS
        </span>
      </div>
    </div>
  );
}

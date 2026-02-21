import BoidsCanvas from '@/features/boids/components/BoidsCanvas';
import BoidsTitle from '@/features/boids/components/BoidsTitle';

export default function Home() {
  return (
    // 全画面の黒背景にキャンバスを配置
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      <BoidsCanvas />
      <BoidsTitle />
    </div>
  );
}

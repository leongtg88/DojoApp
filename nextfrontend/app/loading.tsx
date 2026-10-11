import { KatakanaLoader } from '@/components/navigation/KatakanaLoader';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <KatakanaLoader />
    </div>
  );
}

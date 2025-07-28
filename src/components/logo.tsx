import { Fuel } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center justify-center gap-2 text-primary">
      <Fuel className="h-7 w-7" />
      <span className="text-xl font-bold">FuelTrack Lite</span>
    </div>
  );
}

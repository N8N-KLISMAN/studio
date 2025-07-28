import { Fuel } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center justify-center gap-2 text-primary">
      <Fuel className="h-7 w-7 text-primary" />
      <span className="text-xl font-bold text-foreground">FuelTrack</span>
    </div>
  );
}

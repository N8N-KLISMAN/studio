
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Settings } from 'lucide-react';

interface SettingsMenuProps {
  competitorCount: number;
  onCompetitorCountChange: (count: number) => void;
}

export function SettingsMenu({ competitorCount, onCompetitorCountChange }: SettingsMenuProps) {
  const handleSelectChange = (value: string) => {
    onCompetitorCountChange(Number(value));
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-6 w-6" />
          <span className="sr-only">Abrir Configurações</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configurações</DialogTitle>
          <DialogDescription>
            Ajuste as configurações do formulário de acordo com sua necessidade.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="competitor-count" className="text-right">
              Concorrentes
            </Label>
            <Select
              value={String(competitorCount)}
              onValueChange={handleSelectChange}
            >
              <SelectTrigger id="competitor-count" className="col-span-3">
                <SelectValue placeholder="Selecione o número de concorrentes" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((number) => (
                  <SelectItem key={number} value={String(number)}>
                    {number} Concorrente{number > 1 ? 's' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

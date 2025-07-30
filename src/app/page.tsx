
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { STATIONS } from '@/lib/data';
import type { Station } from '@/lib/types';
import { Logo } from '@/components/logo';

export default function LoginPage() {
  const router = useRouter();
  const [managerId, setManagerId] = useState('');
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managerId || !selectedStation) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    // Save to local storage to simulate a session
    localStorage.setItem('managerId', managerId);
    localStorage.setItem('stationId', selectedStation.id);
    router.push('/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Logo />
          </div>
          <CardTitle className="text-2xl">Acesso do Gerente</CardTitle>
          <CardDescription>
            Insira suas credenciais para registrar os preços de hoje.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="managerId">Nome ou ID do Gerente</Label>
              <Input
                id="managerId"
                placeholder="Ex. João Silva"
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="station">Posto de Gasolina</Label>
              <Select
                onValueChange={(value) => {
                  const station = STATIONS.find((s) => s.id === value) || null;
                  setSelectedStation(station);
                }}
              >
                <SelectTrigger id="station">
                  <SelectValue placeholder="Selecione o seu posto" />
                </SelectTrigger>
                <SelectContent>
                  {STATIONS.map((station) => (
                    <SelectItem key={station.id} value={station.id}>
                      {station.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full">
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

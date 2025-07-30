
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { STATIONS } from '@/lib/data';
import type { Station } from '@/lib/types';
import { PriceForm } from '@/components/price-form';
import { Skeleton } from '@/components/ui/skeleton';
import { LogOut } from 'lucide-react';
import { Logo } from '@/components/logo';

export default function DashboardPage() {
  const [station, setStation] = useState<Station | null>(null);
  const [managerId, setManagerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Since there's no login, we'll use a default manager and the first station
    const defaultManagerId = 'default-manager';
    const defaultStation = STATIONS[0];

    if (defaultStation) {
      setStation(defaultStation);
      setManagerId(defaultManagerId);
    } 
    
    setIsLoading(false);
  }, []);

  if (isLoading || !station || !managerId) {
    return (
       <div className="min-h-screen bg-background">
        <header className="bg-card shadow-sm border-b border-border">
          <div className="container mx-auto flex h-16 items-center justify-between p-4">
            <Logo />
          </div>
        </header>
        <main className="container mx-auto p-4 md:p-8">
            <div className="mb-8 text-center md:text-left">
              <Skeleton className="h-9 w-1/2 mb-4" />
              <Skeleton className="h-6 w-3/4" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full md:w-[400px]" />
              <Skeleton className="h-96 w-full" />
            </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-sm border-b border-border">
        <div className="container mx-auto flex h-16 items-center justify-between p-4">
          <Logo />
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8">
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Registro de Preços Diário
          </h1>
          <p className="text-lg text-muted-foreground">
            Selecione o período e preencha as informações abaixo.
          </p>
        </div>

        <Tabs defaultValue="manha" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
            <TabsTrigger value="manha">Manhã</TabsTrigger>
            <TabsTrigger value="tarde">Tarde</TabsTrigger>
          </TabsList>
          <TabsContent value="manha">
            <PriceForm station={station} period="Manhã" managerId={managerId} />
          </TabsContent>
          <TabsContent value="tarde">
            <PriceForm station={station} period="Tarde" managerId={managerId} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}


'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { STATIONS } from '@/lib/data';
import type { Station } from '@/lib/types';
import { PriceForm } from '@/components/price-form';
import { Skeleton } from '@/components/ui/skeleton';
import { LogOut } from 'lucide-react';
import { Logo } from '@/components/logo';

export default function DashboardPage() {
  const router = useRouter();
  const [station, setStation] = useState<Station | null>(null);
  const [managerId, setManagerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This code now runs only on the client, after the initial render.
    const storedStationId = localStorage.getItem('stationId');
    const storedManagerId = localStorage.getItem('managerId');

    if (!storedStationId || !storedManagerId) {
      router.replace('/login');
      return; // Stop execution if not logged in
    }

    const foundStation = STATIONS.find((s) => s.id === storedStationId);
    if (foundStation) {
      setStation(foundStation);
      setManagerId(storedManagerId);
    } else {
      // Clear invalid data and redirect
      localStorage.removeItem('stationId');
      localStorage.removeItem('managerId');
      router.replace('/login');
    }
    
    setIsLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('stationId');
    localStorage.removeItem('managerId');
    router.replace('/login');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-10" />
        </div>
        <Skeleton className="h-8 w-1/2 mb-2" />
        <Skeleton className="h-6 w-3/4 mb-8" />
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!station || !managerId) {
    // This state will be hit briefly during the redirect,
    // or if the data is invalid. It avoids rendering the full page.
    return null;
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      <header className="bg-card shadow-sm border-b border-border">
        <div className="container mx-auto flex h-16 items-center justify-between p-4">
          <Logo />
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="font-semibold text-foreground">{managerId}</p>
              <p className="text-sm text-muted-foreground">{station.name}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Sair" className="text-muted-foreground hover:text-primary">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
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

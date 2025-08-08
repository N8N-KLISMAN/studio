
'use client';

import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { STATIONS } from '@/lib/data';
import type { Station } from '@/lib/types';
import { PriceForm } from '@/components/price-form';
import { Skeleton } from '@/components/ui/skeleton';
import { Logo } from '@/components/logo';
import { SettingsMenu } from '@/components/settings-menu';
import type { Competitor } from '@/lib/types';


export default function DashboardPage() {
  const [station, setStation] = useState<Station | null>(null);
  const [managerId, setManagerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [numberOfCompetitors, setNumberOfCompetitors] = useState(10);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      const defaultManagerId = 'default-manager';
      setManagerId(defaultManagerId);

      let savedStationData: Station | null = null;
      let savedCompetitorCount: number | null = null;

      try {
        const stationDataString = window.localStorage.getItem('stationData');
        if (stationDataString) {
          savedStationData = JSON.parse(stationDataString);
        }
        const competitorCountString = window.localStorage.getItem('competitorCount');
        if (competitorCountString) {
            savedCompetitorCount = parseInt(competitorCountString, 10);
        }
      } catch (e) {
        console.error("Failed to parse data from localStorage", e);
      }
      
      if (savedCompetitorCount !== null && !isNaN(savedCompetitorCount)) {
          setNumberOfCompetitors(savedCompetitorCount);
      }

      const baseStation = STATIONS[0];

      const resolvedStation = savedStationData ? {
        ...baseStation,
        id: savedStationData.id || baseStation.id,
        name: savedStationData.name || baseStation.name,
        competitors: baseStation.competitors.map((comp, index) => {
          const savedComp = savedStationData?.competitors?.[index];
          return savedComp ? { ...comp, name: savedComp.name } : comp;
        })
      } : baseStation;
      
      setStation(resolvedStation);
      setIsLoading(false);
    }
  }, [isClient]);
  
  const handleCompetitorCountChange = (count: number) => {
    setNumberOfCompetitors(count);
     if (isClient) {
        window.localStorage.setItem('competitorCount', String(count));
     }
  };

  const handleStationUpdate = (updatedStation: Station) => {
    setStation(updatedStation);
     if (isClient) {
        window.localStorage.setItem('stationData', JSON.stringify(updatedStation));
     }
  };
  
  const getVisibleCompetitors = (competitors: Competitor[]): Competitor[] => {
      return competitors.slice(0, numberOfCompetitors);
  }

  if (!isClient || isLoading || !station || !managerId) {
    return (
       <div className="min-h-screen bg-background">
        <header className="bg-card shadow-sm border-b border-border">
          <div className="container mx-auto flex h-16 items-center justify-between p-4">
            <Logo />
             <Skeleton className="h-10 w-10" />
          </div>
        </header>
        <main className="container mx-auto p-4 md:p-8">
            <div className="mb-8 text-center">
              <Skeleton className="h-9 w-1/2 mb-4 mx-auto" />
              <Skeleton className="h-6 w-3/4 mx-auto" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full md:w-[400px] mx-auto" />
              <Skeleton className="h-96 w-full" />
            </div>
        </main>
      </div>
    );
  }
  
  const stationForForm = {
      ...station,
      competitors: getVisibleCompetitors(station.competitors),
  };


  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-sm border-b border-border">
        <div className="container mx-auto flex h-16 items-center justify-between p-4">
          <Logo />
          <SettingsMenu
            competitorCount={numberOfCompetitors}
            onCompetitorCountChange={handleCompetitorCountChange}
          />
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Registro de Preços Diário
          </h1>
          <p className="text-lg text-muted-foreground">
            Selecione o período e preencha as informações abaixo.
          </p>
        </div>

        <Tabs defaultValue="manha" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:w-[400px] mx-auto">
            <TabsTrigger value="manha">Manhã</TabsTrigger>
            <TabsTrigger value="tarde">Tarde</TabsTrigger>
          </TabsList>
          <TabsContent value="manha">
            <PriceForm 
              station={stationForForm} 
              period="Manhã" 
              managerId={managerId} 
              onStationUpdate={handleStationUpdate}
              key={`form-manha-${station.id}-${numberOfCompetitors}`}
            />
          </TabsContent>
          <TabsContent value="tarde">
            <PriceForm 
              station={stationForForm} 
              period="Tarde" 
              managerId={managerId}
              onStationUpdate={handleStationUpdate}
              key={`form-tarde-${station.id}-${numberOfCompetitors}`}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

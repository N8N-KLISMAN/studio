'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { STATIONS } from '@/lib/data';
import { Logo } from '@/components/logo';

const loginSchema = z.object({
  managerId: z.string().min(1, 'O nome do gerente é obrigatório.'),
  stationId: z.string().min(1, 'Por favor, selecione um posto.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      managerId: '',
      stationId: '',
    },
  });

  function onSubmit(data: LoginFormValues) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('managerId', data.managerId);
      localStorage.setItem('stationId', data.stationId);
    }
    toast({
      title: 'Login bem-sucedido!',
      description: `Bem-vindo, ${data.managerId}.`,
    });
    router.push('/dashboard');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background font-sans">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="space-y-4 text-center">
            <div className="flex justify-center">
              <Logo />
            </div>
            <CardTitle>Acesso do Gerente</CardTitle>
            <CardDescription>
              Insira suas credenciais para registrar os preços de hoje.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="managerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome ou ID do Gerente</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: João Silva"
                          {...field}
                          className="text-base"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="stationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Posto de Gasolina</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="text-base">
                            <SelectValue placeholder="Selecione seu posto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {STATIONS.map((station) => (
                            <SelectItem key={station.id} value={station.id}>
                              {station.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full text-lg">
                  Entrar
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

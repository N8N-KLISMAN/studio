'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Station } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { useState } from 'react';
import { CheckCircle2, Loader2, Upload } from 'lucide-react';
import { Separator } from './ui/separator';

const MAX_FILE_SIZE = 5000000;
const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

const priceFormSchema = z.object({
  stationPrice: z.coerce.number({ invalid_type_error: "Deve ser um número" }).positive("O preço deve ser positivo"),
  stationImage: z
    .any()
    .refine((files) => files?.length <= 1, 'Apenas uma imagem é permitida.')
    .refine(
      (files) => (files?.[0] ? files?.[0]?.size <= MAX_FILE_SIZE : true),
      `O tamanho máximo da imagem é 5MB.`
    )
    .refine(
      (files) =>
        files?.[0] ? ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type) : true,
      'Apenas .jpg, .jpeg, .png and .webp são permitidos.'
    )
    .optional(),
  competitors: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      price: z.coerce.number({ invalid_type_error: "Deve ser um número" }).positive("O preço deve ser positivo"),
      image: z
        .any()
        .refine((files) => files?.length <= 1, 'Apenas uma imagem é permitida.')
        .refine(
          (files) => (files?.[0] ? files?.[0]?.size <= MAX_FILE_SIZE : true),
          `O tamanho máximo da imagem é 5MB.`
        )
        .refine(
          (files) =>
            files?.[0] ? ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type) : true,
          'Apenas .jpg, .jpeg, .png and .webp são permitidos.'
        )
        .optional(),
    })
  ),
});

type PriceFormValues = z.infer<typeof priceFormSchema>;

interface PriceFormProps {
  station: Station;
  period: 'Manhã' | 'Tarde';
  managerId: string;
}

export function PriceForm({ station, period, managerId }: PriceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const form = useForm<PriceFormValues>({
    resolver: zodResolver(priceFormSchema),
    defaultValues: {
      stationPrice: undefined,
      competitors: station.competitors.map((c) => ({
        ...c,
        price: undefined,
      })),
    },
  });

  const { fields } = useFieldArray({
    name: 'competitors',
    control: form.control,
  });

  async function onSubmit(data: PriceFormValues) {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const submissionData = {
      managerId,
      stationId: station.id,
      period,
      submittedAt: new Date().toISOString(),
      ...data,
    };

    console.log('Dados do formulário para envio:', submissionData);
    setIsSubmitting(false);
    setShowSuccessDialog(true);
    form.reset();
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="border-primary border-2 shadow-lg">
            <CardHeader>
              <CardTitle className="text-primary">{station.name} (Seu Posto)</CardTitle>
              <CardDescription>
                Informe o preço e anexe uma foto do seu posto.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="stationPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço do Combustível</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="Ex: 5.49" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stationImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Foto do Preço (Opcional)</FormLabel>
                    <FormControl>
                       <Input type="file" {...form.register('stationImage')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Separator/>

          <div className="space-y-4">
             <h3 className="text-lg font-medium">Concorrentes</h3>
            {fields.map((field, index) => (
              <Card key={field.id} className="bg-card/80">
                <CardHeader>
                  <CardTitle>{field.name}</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name={`competitors.${index}.price`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço do Concorrente</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="Ex: 5.52" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`competitors.${index}.image`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Foto do Preço (Opcional)</FormLabel>
                        <FormControl>
                          <Input type="file" {...form.register(`competitors.${index}.image`)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          <Button type="submit" className="w-full text-lg" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              `Enviar Dados (${period})`
            )}
          </Button>
        </form>
      </Form>

      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              Sucesso!
            </AlertDialogTitle>
            <AlertDialogDescription>
              Os dados do período da <strong>{period.toLowerCase()}</strong> foram enviados com sucesso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowSuccessDialog(false)}>
              Fechar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

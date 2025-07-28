
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
import { useState, useEffect } from 'react';
import { Camera, CheckCircle2, Leaf, Loader2, Warehouse, X } from 'lucide-react';
import { Separator } from './ui/separator';
import { Checkbox } from './ui/checkbox';
import Image from 'next/image';
import { submitPrices } from '@/ai/flows/submit-prices-flow';
import { useToast } from '@/hooks/use-toast';

const MAX_FILE_SIZE = 5000000;
const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

const priceSchema = z.object({
  etanol: z.coerce.number({ invalid_type_error: "Deve ser um número" }).positive("O preço deve ser positivo").optional(),
  gasolinaComum: z.coerce.number({ invalid_type_error: "Deve ser um número" }).positive("O preço deve ser positivo").optional(),
  gasolinaAditivada: z.coerce.number({ invalid_type_error: "Deve ser um número" }).positive("O preço deve ser positivo").optional(),
  dieselS10: z.coerce.number({ invalid_type_error: "Deve ser um número" }).positive("O preço deve ser positivo").optional(),
});

const priceFormSchema = z.object({
  stationPrices: priceSchema,
  stationNoChange: z.boolean().default(false),
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
      prices: priceSchema,
      noChange: z.boolean().default(false),
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

const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
};

const ImageUpload = ({ field, label, id }: { field: any, label: string, id: string }) => {
    const [preview, setPreview] = useState<string | null>(null);
    const file = field.value?.[0];

    useEffect(() => {
        if (file) {
            const url = URL.createObjectURL(file);
            setPreview(url);
            return () => URL.revokeObjectURL(url);
        }
        setPreview(null);
    }, [file]);

    const handleRemoveImage = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        const dt = new DataTransfer();
        field.onChange(dt.files);
    };

    return (
        <div className="border-2 border-dashed border-muted rounded-lg p-4 text-center">
            {preview ? (
                <div className="relative w-full h-32">
                    <Image src={preview} alt="Pré-visualização" layout="fill" objectFit="contain" className="rounded-md" />
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                        onClick={handleRemoveImage}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Camera className="h-6 w-6 mb-2" />
                    <FormLabel htmlFor={id} className="cursor-pointer">
                        {label}
                    </FormLabel>
                    <FormControl>
                        <Input
                            id={id}
                            type="file"
                            className="sr-only"
                            onChange={(e) => field.onChange(e.target.files)}
                            accept={ACCEPTED_IMAGE_TYPES.join(',')}
                        />
                    </FormControl>
                    <FormMessage />
                </div>
            )}
        </div>
    );
};

export function PriceForm({ station, period, managerId }: PriceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const { toast } = useToast();

  const form = useForm<PriceFormValues>({
    resolver: zodResolver(priceFormSchema),
    defaultValues: {
      stationPrices: {},
      stationNoChange: false,
      competitors: station.competitors.map((c) => ({
        ...c,
        prices: {},
        noChange: false,
      })),
    },
  });

  const { fields } = useFieldArray({
    name: 'competitors',
    control: form.control,
  });

  const stationNoChange = form.watch('stationNoChange');

  async function onSubmit(data: PriceFormValues) {
    setIsSubmitting(true);
    try {
        const stationImageUri = data.stationImage?.[0] ? await fileToDataUri(data.stationImage[0]) : undefined;
        
        const competitorsWithImages = await Promise.all(
            data.competitors.map(async (c) => {
                const imageUri = c.image?.[0] ? await fileToDataUri(c.image[0]) : undefined;
                return { ...c, image: imageUri };
            })
        );

        const submissionData = {
            managerId,
            stationId: station.id,
            period,
            submittedAt: new Date().toISOString(),
            stationPrices: data.stationPrices,
            stationNoChange: data.stationNoChange,
            stationImage: stationImageUri,
            competitors: competitorsWithImages,
        };

        console.log('Dados do formulário para envio:', submissionData);
        const result = await submitPrices(submissionData);

        if (result.success) {
            setShowSuccessDialog(true);
            form.reset({
                stationPrices: {},
                stationNoChange: false,
                stationImage: undefined,
                competitors: station.competitors.map((c) => ({
                    ...c,
                    prices: {},
                    noChange: false,
                    image: undefined
                })),
            });
            // Clear file inputs manually if reset doesn't work as expected
            const fileInputs = document.querySelectorAll('input[type="file"]');
            fileInputs.forEach(input => (input as HTMLInputElement).value = '');

        } else {
            toast({
                variant: 'destructive',
                title: 'Erro ao Enviar',
                description: result.message,
            });
        }
    } catch (error) {
        console.error('Erro no envio do formulário:', error);
        toast({
            variant: 'destructive',
            title: 'Erro Inesperado',
            description: 'Ocorreu um erro inesperado. Tente novamente mais tarde.',
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Leaf className="h-6 w-6"/>
                {station.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField
                    control={form.control}
                    name="stationImage"
                    render={({ field }) => (
                        <ImageUpload field={field} label="Anexar foto da placa do posto atual" id="stationImage" />
                    )}
                />
              <FormField
                control={form.control}
                name="stationNoChange"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Não houve alteração nos preços hoje
                    </FormLabel>
                  </FormItem>
                )}
              />
              {!stationNoChange && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="stationPrices.etanol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Etanol (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.001" placeholder="0.000" {...field} disabled={stationNoChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="stationPrices.gasolinaComum"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gasolina Comum (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.001" placeholder="0.000" {...field} disabled={stationNoChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="stationPrices.gasolinaAditivada"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gasolina Aditivada (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.001" placeholder="0.000" {...field} disabled={stationNoChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="stationPrices.dieselS10"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diesel S-10 (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.001" placeholder="0.000" {...field} disabled={stationNoChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          <div className="space-y-6">
            {fields.map((field, index) => {
              const competitorNoChange = form.watch(`competitors.${index}.noChange`);
             
              return (
              <Card key={field.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-600">
                    <Warehouse className="h-6 w-6" />
                    {field.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField
                        control={form.control}
                        name={`competitors.${index}.image`}
                        render={({ field: formField }) => (
                           <ImageUpload field={formField} label={`Anexar foto da placa do ${field.name}`} id={`competitors.${index}.image`} />
                        )}
                    />
                  <FormField
                    control={form.control}
                    name={`competitors.${index}.noChange`}
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Este concorrente não alterou os preços
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  {!competitorNoChange && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`competitors.${index}.prices.etanol`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Etanol (R$)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.001" placeholder="0.000" {...field} disabled={competitorNoChange} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`competitors.${index}.prices.gasolinaComum`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gasolina Comum (R$)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.001" placeholder="0.000" {...field} disabled={competitorNoChange} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`competitors.${index}.prices.gasolinaAditivada`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gasolina Aditivada (R$)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.001" placeholder="0.000" {...field} disabled={competitorNoChange} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`competitors.${index}.prices.dieselS10`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Diesel S-10 (R$)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.001" placeholder="0.000" {...field} disabled={competitorNoChange} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  )}
                </CardContent>
              </Card>
            )})}
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
            <AlertDialogTitle className="flex items-center gap-2 text-green-500">
              <CheckCircle2 className="h-6 w-6" />
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

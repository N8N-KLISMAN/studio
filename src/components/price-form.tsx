
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
import { useState, forwardRef, useRef } from 'react';
import { Camera, CheckCircle2, Leaf, Loader2, Warehouse, X } from 'lucide-react';
import { Separator } from './ui/separator';
import { Checkbox } from './ui/checkbox';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';


const photoSchema = z.object({
    dataUri: z.string(),
});

const priceSchema = z.object({
    etanol: z.string().optional(),
    gasolinaComum: z.string().optional(),
    gasolinaAditivada: z.string().optional(),
    dieselS10: z.string().optional(),
});

const allPricesSchema = z.object({
  vista: priceSchema,
  prazo: priceSchema,
});


const priceFormSchema = z.object({
  stationPrices: allPricesSchema,
  stationNoChange: z.boolean().default(false),
  stationPhoto: photoSchema.optional(),
  competitors: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      prices: allPricesSchema,
      noChange: z.boolean().default(false),
      photo: photoSchema.optional(),
    })
  ),
});


type PriceFormValues = z.infer<typeof priceFormSchema>;

interface PriceFormProps {
  station: Station;
  period: 'Manhã' | 'Tarde';
  managerId: string;
}

const PhotoCapture = ({ field, label, id }: { field: any, label: string, id: string }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const photoValue = field.value;

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUri = e.target?.result as string;
            field.onChange({ dataUri });
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveImage = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        field.onChange(undefined);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    
    return (
      <div className="border-2 border-dashed border-muted rounded-lg p-4 text-center">
            {photoValue?.dataUri ? (
                 <div className="space-y-2">
                    <div className="relative w-full h-32">
                        <Image src={photoValue.dataUri} alt="Pré-visualização" layout="fill" objectFit="contain" className="rounded-md" />
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
                </div>
            ) : (
                <>
                    <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        id={id}
                    />
                    <label htmlFor={id} className="cursor-pointer">
                        <Button type="button" variant="ghost" asChild>
                           <span className="flex items-center">
                             <Camera className="h-6 w-6 mr-2" />
                             {label}
                           </span>
                        </Button>
                    </label>
                </>
            )}
        </div>
    );
};


const PriceInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>((props, ref) => {
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
        
        if (value.length > 3) {
            value = value.substring(0, 3);
        }

        if (value.length > 0) {
            if (value.length === 1) {
                // Now just wait for more digits
            } else if (value.length === 2) {
                 value = `${value[0]},${value[1]}`;
            } else if (value.length === 3) {
                 value = `${value[0]},${value.substring(1)}`;
            }
        }

        if (props.onChange) {
            const newEvent = { ...e, target: { ...e.target, value } };
            props.onChange(newEvent as React.ChangeEvent<HTMLInputElement>);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const input = e.target as HTMLInputElement;
        // When user types first digit, add a comma after it.
        if (input.value.length === 1 && e.key !== 'Backspace' && !input.value.includes(',')) {
             const newValue = `${input.value},`;
             if (props.onChange) {
                const newEvent = { ...e, target: { ...e.target, value: newValue } } as any;
                props.onChange(newEvent);
            }
        }
    }

    return <Input type="text" inputMode="decimal" placeholder="0,00" {...props} ref={ref} onKeyDown={handleKeyDown} onChange={handleInputChange} />;
});
PriceInput.displayName = 'PriceInput';


export function PriceForm({ station, period, managerId }: PriceFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof priceFormSchema>>({
    resolver: zodResolver(priceFormSchema),
    defaultValues: {
      stationPrices: { vista: {}, prazo: {} },
      stationNoChange: false,
      competitors: station.competitors.map((c) => ({
        ...c,
        prices: { vista: {}, prazo: {} },
        noChange: false,
      })),
    },
  });

  const { fields } = useFieldArray({
    name: 'competitors',
    control: form.control,
  });

  const stationNoChange = form.watch('stationNoChange');

  const formatPayloadForN8n = (data: PriceFormValues) => {
    const payload: { [key: string]: any } = {};

    payload[`(${station.name}) Foto da minha placa`] = data.stationPhoto?.dataUri || '';
    payload[`(${station.name}) Marcou Opção de Alteração de preço`] = data.stationNoChange;

    const priceTypes = ['etanol', 'gasolinaComum', 'gasolinaAditivada', 'dieselS10'];
    const paymentMethods = ['vista', 'prazo'];
    const paymentLabels = {'vista': 'Preços à Vista', 'prazo': 'Preços a Prazo'};

    paymentMethods.forEach(method => {
        priceTypes.forEach(type => {
            const key = `(${station.name}) ${paymentLabels[method as keyof typeof paymentLabels]}/ ${type}`;
            const value = data.stationPrices?.[method as keyof typeof data.stationPrices]?.[type as keyof typeof priceSchema.shape];
            payload[key] = value ? value.replace(',', '.') : '';
        });
    });

    data.competitors.forEach((competitor, index) => {
        payload[`(${competitor.name}) Foto da placa`] = competitor.photo?.dataUri || '';
        payload[`(${competitor.name}) Marcou Opção de Alteração de preço`] = competitor.noChange;
        
        paymentMethods.forEach(method => {
            priceTypes.forEach(type => {
                const key = `(${competitor.name}) ${paymentLabels[method as keyof typeof paymentLabels]}/ ${type}`;
                const value = competitor.prices?.[method as keyof typeof competitor.prices]?.[type as keyof typeof priceSchema.shape];
                payload[key] = value ? value.replace(',', '.') : '';
            });
        });
    });

    return payload;
};


  async function onSubmit(data: PriceFormValues) {
    const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_URL;
    if (!webhookUrl) {
        console.error("Webhook URL is not defined in .env file.");
        toast({
            variant: 'destructive',
            title: 'Erro de Configuração',
            description: 'A URL do webhook não está configurada.',
        });
        return;
    }
    
    // Show loading alert
    Swal.fire({
      title: 'Enviando...',
      text: 'Por favor, aguarde enquanto os dados são enviados.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    const payload = formatPayloadForN8n(data);

    // Send the data in the background
    fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        mode: 'no-cors' // Prevent CORS issues from blocking the request
    }).then(response => {
        console.log('Dados enviados para o webhook com sucesso (no-cors).');
    }).catch(error => {
        console.error('Erro no envio do formulário em segundo plano:', error);
    });

    // Immediately redirect to success page
    // Using a small timeout to allow the loading Swal to be visible briefly
    setTimeout(() => {
        Swal.close();
        router.push('/success');
    }, 500);
  }

  const renderPriceFields = (fieldPrefix: string, disabled: boolean) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name={`${fieldPrefix}.etanol`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Etanol (R$)</FormLabel>
            <FormControl>
              <PriceInput {...field} disabled={disabled} value={field.value ?? ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`${fieldPrefix}.gasolinaComum`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Gasolina Comum (R$)</FormLabel>
            <FormControl>
              <PriceInput {...field} disabled={disabled} value={field.value ?? ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`${fieldPrefix}.gasolinaAditivada`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Gasolina Aditivada (R$)</FormLabel>
            <FormControl>
              <PriceInput {...field} disabled={disabled} value={field.value ?? ''}/>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`${fieldPrefix}.dieselS10`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Diesel S-10 (R$)</FormLabel>
            <FormControl>
              <PriceInput {...field} disabled={disabled} value={field.value ?? ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

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
                    name="stationPhoto"
                    render={({ field }) => (
                        <PhotoCapture field={field} label="Tirar foto da placa do posto" id="stationPhoto" />
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
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-medium mb-4">Preços à Vista</h3>
                        {renderPriceFields('stationPrices.vista', stationNoChange)}
                    </div>
                    <Separator />
                    <div>
                        <h3 className="text-lg font-medium mb-4">Preços a Prazo</h3>
                        {renderPriceFields('stationPrices.prazo', stationNoChange)}
                    </div>
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
                        name={`competitors.${index}.photo`}
                        render={({ field: formField }) => (
                           <PhotoCapture field={formField} label={`Tirar foto da placa do ${field.name}`} id={`competitors.${index}.photo`} />
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
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-medium mb-4">Preços à Vista</h3>
                            {renderPriceFields(`competitors.${index}.prices.vista`, competitorNoChange)}
                        </div>
                        <Separator />
                        <div>
                            <h3 className="text-lg font-medium mb-4">Preços a Prazo</h3>
                            {renderPriceFields(`competitors.${index}.prices.prazo`, competitorNoChange)}
                        </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )})}
          </div>

          <Button type="submit" className="w-full text-lg" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
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
    </>
  );
}

    

    
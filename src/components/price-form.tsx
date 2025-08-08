
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm, FormProvider } from 'react-hook-form';
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
import { useState, forwardRef, useRef, useEffect } from 'react';
import { Camera, Fuel, Leaf, Pencil } from 'lucide-react';
import { Separator } from './ui/separator';
import { Checkbox } from './ui/checkbox';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { STATIONS } from '@/lib/data';

const REQUIRED_FIELD_MESSAGE = "Preencha Aqui!";

const photoSchema = z.object({
    dataUri: z.string().min(1, { message: REQUIRED_FIELD_MESSAGE }),
}).optional();

const priceValueSchema = z.string().refine(val => val.trim().length > 0, { message: REQUIRED_FIELD_MESSAGE });

const priceSchema = z.object({
    etanol: priceValueSchema,
    gasolinaComum: priceValueSchema,
    gasolinaAditivada: priceValueSchema,
    dieselS10: priceValueSchema,
});

const emptyPriceSchema = z.object({
    etanol: z.string().optional(),
    gasolinaComum: z.string().optional(),
    gasolinaAditivada: z.string().optional(),
    dieselS10: z.string().optional(),
})

const emptyAllPricesSchema = z.object({
  vista: emptyPriceSchema,
  prazo: emptyPriceSchema,
});


const competitorSchema = z.object({
      id: z.string(),
      name: z.string().min(1, { message: "Nome é obrigatório" }),
      prices: emptyAllPricesSchema, // Initially optional
      noChange: z.boolean().default(false),
      photo: photoSchema,
    }).superRefine((data, ctx) => {
      if (!data.noChange && !data.photo?.dataUri) {
         ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['photo'],
              message: REQUIRED_FIELD_MESSAGE,
          });
      }
});


export const priceFormSchema = z.object({
  stationName: z.string().min(1, { message: "Nome é obrigatório" }),
  stationPrices: emptyAllPricesSchema, // Initially optional
  stationNoChange: z.boolean().default(false),
  stationPhoto: photoSchema,
  competitors: z.array(competitorSchema),
}).superRefine((data, ctx) => {
    // Station validation
    if (!data.stationNoChange) {
        if (!data.stationPhoto?.dataUri) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['stationPhoto'],
                message: REQUIRED_FIELD_MESSAGE,
            });
        }
        
        const priceTypes = ['etanol', 'gasolinaComum', 'gasolinaAditivada', 'dieselS10'] as const;

        priceTypes.forEach(type => {
            if ((!data.stationPrices.vista[type] || data.stationPrices.vista[type] === '') && data.stationPrices.vista[type] !== 'Sem dados') {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['stationPrices', 'vista', type],
                    message: REQUIRED_FIELD_MESSAGE,
                });
            }
            if ((!data.stationPrices.prazo[type] || data.stationPrices.prazo[type] === '') && data.stationPrices.prazo[type] !== 'Sem dados') {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['stationPrices', 'prazo', type],
                    message: REQUIRED_FIELD_MESSAGE,
                });
            }
        });
    }

    // Competitors validation
    data.competitors.forEach((competitor, index) => {
        if (!competitor.noChange) {
            const priceTypes = ['etanol', 'gasolinaComum', 'gasolinaAditivada', 'dieselS10'] as const;
            priceTypes.forEach(type => {
                if ((!competitor.prices.vista[type] || competitor.prices.vista[type] === '') && competitor.prices.vista[type] !== 'Sem dados') {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        path: [`competitors`, index, 'prices', 'vista', type],
                        message: REQUIRED_FIELD_MESSAGE,
                    });
                }
                if ((!competitor.prices.prazo[type] || competitor.prices.prazo[type] === '') && competitor.prices.prazo[type] !== 'Sem dados') {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        path: [`competitors`, index, 'prices', 'prazo', type],
                        message: REQUIRED_FIELD_MESSAGE,
                    });
                }
            });
        }
    });
});


export type PriceFormValues = z.infer<typeof priceFormSchema>;

interface PriceFormProps {
  station: Station;
  period: 'Manhã' | 'Tarde';
  managerId: string;
  onStationUpdate: (station: Station) => void;
}

const EditableTitle = ({
    Icon,
    name,
    onNameChange,
}: {
    Icon: React.ElementType,
    name: string,
    onNameChange: (newName: string) => void
}) => {
    return (
        <div className="flex items-center gap-2 text-primary">
            <Icon className="h-6 w-6" />
            <Input
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                className="text-2xl font-semibold leading-none tracking-tight border-0 shadow-none focus-visible:ring-0 p-0 h-auto flex-1"
            />
            <Pencil className="h-5 w-5 text-muted-foreground/50" />
        </div>
    );
};


const PhotoCapture = ({ field, label, id, error }: { field: any, label: string, id: string, error?: string }) => {
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
        field.onChange(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    
    return (
      <div className="border-2 border-dashed border-muted-foreground/60 rounded-lg p-4 text-center">
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
                            <Pencil className="h-4 w-4" />
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
                           <span className="flex items-center text-base">
                             <Camera className="h-8 w-8 mr-2" />
                             {label}
                           </span>
                        </Button>
                    </label>
                </>
            )}
             {error && <p className="text-sm font-medium text-destructive mt-2">{error}</p>}
        </div>
    );
};


const PriceInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>((props, ref) => {
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        if (value !== 'Sem dados') {
            value = value.replace(/\D/g, ''); 
        
            if (value.length > 3) {
                value = value.substring(0, 3);
            }

            if (value.length > 1) {
                 value = `${value[0]},${value.substring(1)}`;
            }
        }

        if (props.onChange) {
            const newEvent = { ...e, target: { ...e.target, value } };
            props.onChange(newEvent as React.ChangeEvent<HTMLInputElement>);
        }
    };

    return <Input type="text" inputMode="decimal" placeholder="0,00" {...props} ref={ref} onChange={handleInputChange} />;
});
PriceInput.displayName = 'PriceInput';


const PriceInputWithNoData = ({field, disabled}: {field: any, disabled: boolean}) => {
    const [isNoData, setIsNoData] = useState(field.value === "Sem dados");
    const uniqueId = useRef(`no-data-check-${Math.random()}`).current;

    useEffect(() => {
        setIsNoData(field.value === "Sem dados");
    }, [field.value]);

    const handleCheckedChange = (checked: boolean | 'indeterminate') => {
        const isChecked = !!checked;
        setIsNoData(isChecked);
        if (isChecked) {
            field.onChange("Sem dados");
        } else {
            field.onChange(""); // Clear the field
        }
    };

    const isFieldDisabled = disabled || isNoData;

    return (
        <div className="flex items-center gap-2">
            <PriceInput {...field} disabled={isFieldDisabled} value={field.value ?? ''} className="flex-1" />
            {!disabled && (
                 <div className="flex items-center space-x-2">
                    <Checkbox
                        id={uniqueId}
                        checked={isNoData}
                        onCheckedChange={handleCheckedChange}
                    />
                     {!isNoData && (
                        <label
                            htmlFor={uniqueId}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Sem dados
                        </label>
                    )}
                </div>
            )}
        </div>
    )
}


export function PriceForm({ station, period, managerId, onStationUpdate }: PriceFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  const storageKey = `price-form-${station.id}-${period.toLowerCase()}`;

  const form = useForm<PriceFormValues>({
    resolver: zodResolver(priceFormSchema),
    defaultValues: {
      stationName: station.name,
      stationPrices: { vista: {}, prazo: {} },
      stationNoChange: false,
      competitors: station.competitors.map((c) => ({
        ...c,
        prices: { vista: {}, prazo: {} },
        noChange: false,
      })),
    },
    mode: 'onBlur',
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Effect for loading form data from localStorage
  useEffect(() => {
    if (isClient) {
      const savedData = window.localStorage.getItem(storageKey);
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          form.reset(parsedData);
        } catch (e) {
          console.error("Failed to parse saved form data", e);
        }
      }
    }
  }, [isClient, storageKey, form]);

  // Effect for saving form data to localStorage
  useEffect(() => {
    if (isClient) {
      const subscription = form.watch((value) => {
        window.localStorage.setItem(storageKey, JSON.stringify(value));
      });
      return () => subscription.unsubscribe();
    }
  }, [isClient, storageKey, form]);
  
  const { fields } = useFieldArray({
    name: 'competitors',
    control: form.control,
  });
  
  const stationNoChange = form.watch('stationNoChange');

  const handleStationNameChange = (newName: string) => {
    form.setValue('stationName', newName);
    // No longer calling onStationUpdate here to prevent re-renders on parent
  };

  const handleCompetitorNameChange = (index: number, newName: string) => {
    form.setValue(`competitors.${index}.name`, newName);
    // No longer calling onStationUpdate here to prevent re-renders on parent
  };

  const formatPayloadForN8n = (data: PriceFormValues) => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const dateStr = `${day}/${month}/${year}`;
    const timeStr = `${hours}:${minutes}`;

    const dateTimeFormatted = `(${dateStr}) (${timeStr})`;
    
    const payload: { [key: string]: any } = {};

    const extractBase64 = (dataUri: string | undefined) => {
        if (!dataUri) return '';
        return dataUri.split(',')[1] || '';
    };

    const originalStation = STATIONS.find(s => s.id === station.id) ?? station;
    
    payload["Data e Hora do Envio"] = dateTimeFormatted;
    payload["Periodo Marcado"] = period;
    payload["Nome do Posto"] = data.stationName;

    const stationPrefix = `(${originalStation.name})`;
    payload[`${stationPrefix} Foto da minha placa`] = extractBase64(data.stationPhoto?.dataUri);
    payload[`${stationPrefix} Marcou Opção de Alteração de preço`] = data.stationNoChange ? 'SIM' : 'NÃO';

    const priceTypes = ['etanol', 'gasolinaComum', 'gasolinaAditivada', 'dieselS10'];
    const paymentMethods: Array<keyof PriceFormValues['stationPrices']> = ['vista', 'prazo'];
    const paymentLabels = {'vista': 'Preços a vista', 'prazo': 'Preços a Prazo'};

    if (!data.stationNoChange) {
        paymentMethods.forEach(method => {
            priceTypes.forEach(type => {
                const key = `${stationPrefix} ${paymentLabels[method]}/${type}`;
                const stationPriceValue = data.stationPrices?.[method]?.[type as keyof z.infer<typeof emptyPriceSchema>];
                
                if(stationPriceValue === 'Sem dados'){
                     payload[key] = 'Sem dados';
                } else {
                    payload[key] = stationPriceValue ? stationPriceValue.replace(',', '.') : '';
                }
            });
        });
    }

    data.competitors.forEach((competitor, index) => {
        const originalCompetitor = originalStation.competitors[index];
        const competitorPrefix = `(${originalCompetitor.name})`;

        payload[`Nome do Concorrente ${index + 1}`] = competitor.name;
        payload[`${competitorPrefix} Foto da placa`] = extractBase64(competitor.photo?.dataUri);
        payload[`${competitorPrefix} Marcou Opção de Alteração de preço`] = competitor.noChange ? 'SIM' : 'NÃO';
        
        if (!competitor.noChange) {
            paymentMethods.forEach(method => {
                priceTypes.forEach(type => {
                    const key = `${competitorPrefix} ${paymentLabels[method]}/${type}`;
                    const competitorPriceValue = competitor.prices?.[method]?.[type as keyof z.infer<typeof emptyPriceSchema>];

                     if(competitorPriceValue === 'Sem dados'){
                        payload[key] = 'Sem dados';
                    } else {
                       payload[key] = competitorPriceValue ? competitorPriceValue.replace(',', '.') : '';
                    }
                });
            });
        }
    });

    return payload;
};

const onFormError = (errors: any) => {
    console.log("Form errors:", errors);
    Swal.fire({
      icon: 'warning',
      title: 'Atenção!',
      text: 'Existem campos obrigatórios não preenchidos. Por favor, verifique os campos marcados em vermelho.',
      confirmButtonColor: 'hsl(var(--primary))'
    });
};

  async function onSubmit(data: PriceFormValues) {
    // This is where we ensure the edited names in the form are passed up to the parent component
    // right before submission, so the parent can persist them correctly.
    const updatedStationData: Station = {
        ...station,
        name: data.stationName,
        competitors: data.competitors.map((c, i) => ({
            id: station.competitors[i].id,
            name: c.name
        }))
    };
    onStationUpdate(updatedStationData);

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
    
    Swal.fire({
      title: 'Enviando...',
      text: 'Por favor, aguarde enquanto os dados são enviados.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    const payload = formatPayloadForN8n(data);
    
    console.log("Payload to be sent:", JSON.stringify(payload, null, 2));

    try {
        await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        Swal.close();
        
        // Get current data, clear only photos, and reset the form
        const currentData = form.getValues();
        currentData.stationPhoto = undefined;
        currentData.competitors.forEach(c => c.photo = undefined);
        form.reset(currentData);
        
        // Also clear photos from localStorage
        window.localStorage.setItem(storageKey, JSON.stringify(currentData));
        
        Swal.fire({
            icon: 'success',
            title: 'Sucesso!',
            text: 'Os dados foram enviados corretamente.',
            confirmButtonColor: 'hsl(var(--primary))'
        }).then(() => {
             router.push(`/success?period=${period}`);
        });

    } catch (error) {
        Swal.close();
        console.error('Erro no envio do formulário:', error);
         Swal.fire({
            icon: 'error',
            title: 'Erro no Envio',
            text: 'Não foi possível enviar os dados. Por favor, tente novamente.',
            confirmButtonColor: 'hsl(var(--destructive))'
        });
    }
  }

  const renderPriceFields = (fieldPrefix: string, disabled: boolean) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
      <FormField
        control={form.control}
        name={`${fieldPrefix}.etanol`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Etanol (R$)</FormLabel>
            <FormControl>
                <PriceInputWithNoData field={field} disabled={disabled} />
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
            <FormLabel className="font-semibold">Gasolina Comum (R$)</FormLabel>
            <FormControl>
              <PriceInputWithNoData field={field} disabled={disabled} />
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
              <PriceInputWithNoData field={field} disabled={disabled} />
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
              <PriceInputWithNoData field={field} disabled={disabled} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  return (
    <FormProvider {...form}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, onFormError)} className="space-y-8 mt-4">
          <Card>
            <CardHeader>
                <EditableTitle
                    Icon={Leaf}
                    name={form.watch('stationName')}
                    onNameChange={handleStationNameChange}
                />
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField
                    control={form.control}
                    name="stationPhoto"
                    render={({ field, fieldState }) => (
                        <PhotoCapture 
                            field={field} 
                            label="Tirar foto da placa do posto" 
                            id="stationPhoto"
                            error={fieldState.error?.message}
                         />
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
                        <h3 className="text-lg font-semibold mb-4">Preços à Vista</h3>
                        {renderPriceFields('stationPrices.vista', stationNoChange)}
                    </div>
                    <Separator />
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Preços a Prazo</h3>
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
                    <EditableTitle
                        Icon={Fuel}
                        name={form.watch(`competitors.${index}.name`)}
                        onNameChange={(newName) => handleCompetitorNameChange(index, newName)}
                    />
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField
                        control={form.control}
                        name={`competitors.${index}.photo`}
                        render={({ field: formField, fieldState }) => (
                           <PhotoCapture 
                                field={formField} 
                                label={`Tirar foto da placa do ${form.watch(`competitors.${index}.name`)}`} 
                                id={`competitors.${index}.photo`}
                                error={fieldState.error?.message}
                            />
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
                            <h3 className="text-lg font-semibold mb-4">Preços à Vista</h3>
                            {renderPriceFields(`competitors.${index}.prices.vista`, competitorNoChange)}
                        </div>
                        <Separator />
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Preços a Prazo</h3>
                            {renderPriceFields(`competitors.${index}.prices.prazo`, competitorNoChange)}
                        </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )})}
          </div>

          <Button type="submit" className="w-full text-lg">
            {`Enviar Dados (${period})`}
          </Button>
        </form>
      </Form>
    </FormProvider>
  );
}

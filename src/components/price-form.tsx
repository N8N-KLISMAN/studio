
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
import { useState, useEffect, forwardRef, useRef } from 'react';
import { Camera, CheckCircle2, Leaf, Loader2, MapPin, Warehouse, X, AlertCircle } from 'lucide-react';
import { Separator } from './ui/separator';
import { Checkbox } from './ui/checkbox';
import Image from 'next/image';
import { submitPrices } from '@/ai/flows/submit-prices-flow';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';


const MAX_FILE_SIZE = 5000000;
const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

const photoSchema = z.object({
    dataUri: z.string(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
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
}).transform((data) => {
    const processPrices = (prices: Record<string, string | undefined> | undefined) => {
        if (!prices) return {};
        const newPrices: Record<string, number | undefined> = {};
        for (const key in prices) {
            const value = prices[key];
            if (typeof value === 'string' && value.includes(',')) {
                newPrices[key] = parseFloat(value.replace(',', '.'));
            } else if(value) {
                newPrices[key] = parseFloat(value);
            }
        }
        return newPrices;
    };

    const processAllPrices = (allPrices: { vista?: any, prazo?: any}) => {
        return {
            vista: processPrices(allPrices.vista),
            prazo: processPrices(allPrices.prazo),
        }
    }

    // This renaming is important for the backend flow
    const competitorsWithImage = data.competitors.map(c => ({
        ...c,
        image: c.photo?.dataUri, // Rename photo.dataUri to image
    }));

    return {
        ...data,
        stationImage: data.stationPhoto?.dataUri, // Rename stationPhoto.dataUri to stationImage
        stationPrices: processAllPrices(data.stationPrices),
        competitors: competitorsWithImage.map(c => ({
            ...c,
            prices: processAllPrices(c.prices),
        })),
    };
});


type PriceFormValues = z.infer<typeof priceFormSchema>;

interface PriceFormProps {
  station: Station;
  period: 'Manhã' | 'Tarde';
  managerId: string;
}

const PhotoCapture = ({ field, label, id }: { field: any, label: string, id: string }) => {
    const { toast } = useToast();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

    const photoValue = field.value;

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            setHasCameraPermission(true);
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setIsCapturing(true);
        } catch (error) {
            console.error('Error accessing camera:', error);
            setHasCameraPermission(false);
            toast({
                variant: 'destructive',
                title: 'Acesso à câmera negado',
                description: 'Por favor, habilite a permissão da câmera nas configurações do seu navegador.',
            });
            setIsCapturing(false);
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setIsCapturing(false);
    };

    const takePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            const dataUri = canvas.toDataURL('image/jpeg');

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((position) => {
                    field.onChange({
                        dataUri,
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                    stopCamera();
                }, (error) => {
                    console.error("Error getting geolocation:", error);
                    toast({
                        variant: "destructive",
                        title: "Erro de Geolocalização",
                        description: "Não foi possível obter sua localização. A foto será salva sem essa informação."
                    });
                    field.onChange({ dataUri }); // Save without location
                    stopCamera();
                });
            } else {
                 toast({
                    variant: "destructive",
                    title: "Geolocalização não suportada",
                    description: "Seu navegador não suporta geolocalização. A foto será salva sem essa informação."
                });
                field.onChange({ dataUri }); // Save without location
                stopCamera();
            }
        }
    };
    
    const handleRemoveImage = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        field.onChange(undefined);
    };

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            stopCamera();
        };
    }, []);

    if (isCapturing) {
        return (
            <div className="space-y-4">
                <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted playsInline />
                <div className="flex gap-2">
                    <Button onClick={takePhoto} className="w-full">
                        <Camera className="mr-2 h-4 w-4" />
                        Capturar Foto
                    </Button>
                    <Button variant="outline" onClick={stopCamera}>Cancelar</Button>
                </div>
            </div>
        )
    }

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
                    {photoValue.latitude && photoValue.longitude && (
                        <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{photoValue.latitude.toFixed(5)}, {photoValue.longitude.toFixed(5)}</span>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Button type="button" variant="ghost" onClick={startCamera}>
                        <Camera className="h-6 w-6 mr-2" />
                        {label}
                    </Button>
                     {hasCameraPermission === false && (
                         <Alert variant="destructive" className="mt-4 text-left">
                            <AlertCircle className="h-4 w-4" />
                             <AlertTitle>Câmera Bloqueada</AlertTitle>
                             <AlertDescription>
                                 Para tirar fotos, você precisa permitir o acesso à câmera nas configurações do seu navegador.
                             </AlertDescription>
                         </Alert>
                     )}
                </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};


const PriceInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>((props, ref) => {
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, ''); // Remove all non-digits
        if (value.length > 3) {
            value = value.substring(0, 3);
        }
        if (value.length > 1) {
            value = value.replace(/^(\d)(\d{2})$/, '$1,$2');
        }

        if (props.onChange) {
            const newEvent = { ...e, target: { ...e.target, value } };
            props.onChange(newEvent as React.ChangeEvent<HTMLInputElement>);
        }
    };

    return <Input type="text" inputMode="decimal" placeholder="0,00" {...props} ref={ref} onChange={handleInputChange} />;
});
PriceInput.displayName = 'PriceInput';


export function PriceForm({ station, period, managerId }: PriceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
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

  async function onSubmit(data: any) {
    setIsSubmitting(true);
    try {
        const submissionData = {
            managerId,
            stationId: station.id,
            period,
            submittedAt: new Date().toISOString(),
            stationPrices: data.stationPrices,
            stationNoChange: data.stationNoChange,
            stationImage: data.stationImage, // This is now an object with dataUri
            competitors: data.competitors, // This now contains photo object
        };

        console.log('Dados do formulário para envio:', submissionData);
        // The transform function handles renaming, so we cast to any
        const result = await submitPrices(submissionData as any);

        if (result.success) {
            setShowSuccessDialog(true);
            form.reset({
                stationPrices: { vista: {}, prazo: {} },
                stationNoChange: false,
                stationPhoto: undefined,
                competitors: station.competitors.map((c) => ({
                    ...c,
                    prices: { vista: {}, prazo: {} },
                    noChange: false,
                    photo: undefined
                })),
            });
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

  const renderPriceFields = (fieldPrefix: string, disabled: boolean) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name={`${fieldPrefix}.etanol`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Etanol (R$)</FormLabel>
            <FormControl>
              <PriceInput {...field} disabled={disabled} />
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
              <PriceInput {...field} disabled={disabled} />
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
              <PriceInput {...field} disabled={disabled} />
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
              <PriceInput {...field} disabled={disabled} />
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


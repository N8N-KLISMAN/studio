
'use server';
/**
 * @fileOverview A flow to handle price submissions from the form.
 *
 * - submitPrices - A function that handles the price submission process.
 * - SubmitPricesInput - The input type for the submitPrices function.
 * - SubmitPricesOutput - The return type for the submitPrices function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const PriceSchema = z.object({
  etanol: z.coerce.number().optional(),
  gasolinaComum: z.coerce.number().optional(),
  gasolinaAditivada: z.coerce.number().optional(),
  dieselS10: z.coerce.number().optional(),
});

const AllPricesSchema = z.object({
    vista: PriceSchema,
    prazo: PriceSchema,
});


const CompetitorSchema = z.object({
  id: z.string(),
  name: z.string(),
  prices: AllPricesSchema,
  noChange: z.boolean().default(false),
  image: z
    .string()
    .describe(
      "A photo of the competitor's price board, as a data URI."
    ).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const SubmitPricesInputSchema = z.object({
  managerId: z.string(),
  stationId: z.string(),
  period: z.string(),
  submittedAt: z.string(),
  stationPrices: AllPricesSchema,
  stationNoChange: z.boolean().default(false),
  stationImage: z
    .string()
    .describe(
        "A photo of the station's price board, as a data URI."
    ).optional(),
  stationLatitude: z.number().optional(),
  stationLongitude: z.number().optional(),
  competitors: z.array(CompetitorSchema),
});

export type SubmitPricesInput = z.infer<typeof SubmitPricesInputSchema>;

const SubmitPricesOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type SubmitPricesOutput = z.infer<typeof SubmitPricesOutputSchema>;

export async function submitPrices(
  input: SubmitPricesInput
): Promise<SubmitPricesOutput> {
  return submitPricesFlow(input);
}

const submitPricesFlow = ai.defineFlow(
  {
    name: 'submitPricesFlow',
    inputSchema: SubmitPricesInputSchema,
    outputSchema: SubmitPricesOutputSchema,
  },
  async (input) => {
    // Extract geolocation from the photo objects and place it at the top level
    const stationImage = input.stationImage as any;
    const stationLatitude = stationImage?.latitude;
    const stationLongitude = stationImage?.longitude;

    const competitors = input.competitors.map(c => {
        const photo = (c as any).photo;
        return {
            id: c.id,
            name: c.name,
            prices: c.prices,
            noChange: c.noChange,
            image: photo?.dataUri,
            latitude: photo?.latitude,
            longitude: photo?.longitude,
        }
    });

    const processedInput = {
        ...input,
        stationImage: stationImage?.dataUri,
        stationLatitude,
        stationLongitude,
        competitors,
    };
    
    console.log('Received price submission:', JSON.stringify(processedInput, null, 2));


    // Here you would typically save the data to a database like Firestore.
    // For now, we'll just simulate a successful submission.

    return {
      success: true,
      message: 'Dados enviados com sucesso!',
    };
  }
);

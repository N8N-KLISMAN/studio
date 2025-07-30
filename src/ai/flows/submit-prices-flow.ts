
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

const PhotoSchema = z.object({
    dataUri: z.string().describe("The photo as a data URI."),
})

const CompetitorSchema = z.object({
  id: z.string(),
  name: z.string(),
  prices: AllPricesSchema,
  noChange: z.boolean().default(false),
  image: PhotoSchema.optional(),
});

const SubmitPricesInputSchema = z.object({
  managerId: z.string(),
  stationId: z.string(),
  period: z.string(),
  submittedAt: z.string(),
  stationPrices: AllPricesSchema,
  stationNoChange: z.boolean().default(false),
  stationImage: PhotoSchema.optional(),
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
    // This flow is a placeholder. The actual submission logic is now handled on the client-side
    // in price-form.tsx to call the n8n webhook directly.
    
    console.log('Flow received data (client-side handles submission):', JSON.stringify(input, null, 2));

    // We can keep this flow for potential future server-side processing or logging if needed.
    // For now, it just simulates a success response as the client handles the actual API call.

    return {
      success: true,
      message: 'Dados recebidos pelo fluxo, mas o envio é feito pelo cliente.',
    };
  }
);

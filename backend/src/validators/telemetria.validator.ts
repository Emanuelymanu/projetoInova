import { z } from 'zod';

export const telemetriaSchema = z.object({
  codigo_identificador: z.string().trim().min(1).max(50),
  distancia_cm: z.number().min(0).max(1000),
  // Opcional: sensor sem medição de bateria mantém o último valor conhecido.
  nivel_bateria_pct: z.number().min(0).max(100).optional(),
});

export type TelemetriaInput = z.infer<typeof telemetriaSchema>;

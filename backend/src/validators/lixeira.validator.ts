import { z } from 'zod';

export const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

export const filtroZonaSchema = z.object({
  zonaId: z.coerce.number().int().positive().optional(),
});

export const historicoQuerySchema = z.object({
  horas: z.coerce.number().int().min(1).max(720).default(24),
});

/**
 * EPC da tag UHF. Leitores no modo teclado podem mandar espaços ou letras minúsculas,
 * então o código é normalizado antes de comparar.
 */
export const epcSchema = z
  .string()
  .transform((v) => normalizarEpc(v))
  .pipe(z.string().regex(/^[0-9A-Z]{4,64}$/, 'Use de 4 a 64 letras ou números'));

export function normalizarEpc(valor: string) {
  return valor.replace(/[\s:-]/g, '').toUpperCase();
}

export const criarLixeiraSchema = z.object({
  codigo_identificador: z.string().trim().min(1).max(50),
  epc: epcSchema.nullable().optional(),
  endereco: z.string().trim().max(150).nullable().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  capacidade_litros: z.number().int().positive().optional(),
  altura_cm: z.number().int().positive().max(1000).optional(),
  zona_id: z.number().int().positive().nullable().optional(),
});

export const atualizarLixeiraSchema = criarLixeiraSchema
  .partial()
  .extend({ status: z.enum(['OPERACIONAL', 'MANUTENCAO', 'DESATIVADO']).optional() })
  // Latitude e longitude mudam juntas, para o POINT continuar coerente.
  .refine((d) => (d.latitude === undefined) === (d.longitude === undefined), {
    message: 'Informe latitude e longitude juntas',
    path: ['latitude'],
  });

export type CriarLixeiraInput = z.infer<typeof criarLixeiraSchema>;
export type AtualizarLixeiraInput = z.infer<typeof atualizarLixeiraSchema>;

import { z } from 'zod';
import { STATUS_ROTA } from '../models/Rota';

const data = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD');

export const filtroRotasSchema = z.object({
  data: data.optional(),
  de: data.optional(),
  ate: data.optional(),
  motoristaId: z.coerce.number().int().positive().optional(),
  status: z.enum(STATUS_ROTA).optional(),
});

export const criarRotaSchema = z.object({
  motorista_id: z.number().int().positive(),
  data_rota: data,
  // A ordem do array é a ordem de visita.
  lixeira_ids: z
    .array(z.number().int().positive())
    .min(1, 'Escolha pelo menos uma lixeira')
    .max(200)
    .refine((ids) => new Set(ids).size === ids.length, 'Lixeira repetida na rota'),
});

export const paradaParamSchema = z.object({
  id: z.coerce.number().int().positive(),
  paradaId: z.coerce.number().int().positive(),
});

export const marcarParadaSchema = z.object({ coletado: z.boolean() });

export type FiltroRotasInput = z.infer<typeof filtroRotasSchema>;
export type CriarRotaInput = z.infer<typeof criarRotaSchema>;

// O EPC é normalizado e comparado no service; aqui só limita o tamanho.
export const leituraRfidSchema = z.object({ epc: z.string().trim().min(1).max(100) });

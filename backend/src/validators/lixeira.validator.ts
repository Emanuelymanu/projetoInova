import { z } from 'zod';

export const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

export const filtroZonaSchema = z.object({
  zonaId: z.coerce.number().int().positive().optional(),
});

export const historicoQuerySchema = z.object({
  horas: z.coerce.number().int().min(1).max(720).default(24),
});

export const criarLixeiraSchema = z.object({
  codigo_identificador: z.string().trim().min(1).max(50),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  capacidade_litros: z.number().int().positive().optional(),
  altura_cm: z.number().int().positive().max(1000).optional(),
  zona_id: z.number().int().positive().nullable().optional(),
});

export type CriarLixeiraInput = z.infer<typeof criarLixeiraSchema>;

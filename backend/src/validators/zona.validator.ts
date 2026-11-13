import { z } from 'zod';

export const criarZonaSchema = z.object({
  nome: z.string().trim().min(2).max(100),
  descricao: z.string().trim().max(500).nullable().optional(),
});

export const atualizarZonaSchema = criarZonaSchema.partial();

export type CriarZonaInput = z.infer<typeof criarZonaSchema>;
export type AtualizarZonaInput = z.infer<typeof atualizarZonaSchema>;

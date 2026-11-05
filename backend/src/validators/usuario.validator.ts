import { z } from 'zod';
import { TIPOS_USUARIO } from '../models/Usuario';

const email = z.string().trim().toLowerCase().max(100).pipe(z.email());

export const cadastroSchema = z.object({
  nome: z.string().trim().min(2).max(100),
  email,
  // bcrypt só considera os primeiros 72 bytes da senha.
  senha: z.string().min(8).max(72),
});

export const loginSchema = z.object({
  email,
  senha: z.string().min(1).max(72),
});

export const criarUsuarioSchema = cadastroSchema.extend({
  tipo: z.enum(TIPOS_USUARIO),
});

export type CadastroInput = z.infer<typeof cadastroSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_EXPIRA_EM } from '../config/constants';
import { env } from '../config/env';
import { Usuario } from '../models';
import type { TipoUsuario } from '../models/Usuario';
import { AppError } from '../utils/AppError';
import type { LoginInput } from '../validators/usuario.validator';
import { paraUsuarioDTO } from './usuario.service';

const ALGORITMO = 'HS256';

export function gerarToken(usuario: { id: number; tipo: TipoUsuario }): string {
  return jwt.sign({ tipo: usuario.tipo }, env.JWT_SECRET, {
    subject: String(usuario.id),
    expiresIn: JWT_EXPIRA_EM,
    algorithm: ALGORITMO,
  });
}

export function verificarToken(token: string): { id: number; tipo: TipoUsuario } {
  const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: [ALGORITMO] });
  if (typeof payload === 'string') throw new AppError(401, 'Token inválido');
  return { id: Number(payload.sub), tipo: payload.tipo };
}

export async function login({ email, senha }: LoginInput) {
  const usuario = await Usuario.findOne({ where: { email } });
  const senhaCorreta = usuario ? await bcrypt.compare(senha, usuario.senha_hash) : false;

  // Mesma mensagem nos dois casos para não revelar quais e-mails existem.
  if (!usuario || !senhaCorreta) throw new AppError(401, 'E-mail ou senha incorretos');
  if (!usuario.ativo) throw new AppError(403, 'Conta desativada. Fale com o gestor.');

  return { token: gerarToken(usuario), usuario: paraUsuarioDTO(usuario) };
}

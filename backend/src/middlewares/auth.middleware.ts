import type { NextFunction, Request, Response } from 'express';
import type { TipoUsuario } from '../models/Usuario';
import { verificarToken } from '../services/auth.service';
import { AppError } from '../utils/AppError';

export function autenticar(req: Request, _res: Response, next: NextFunction) {
  const [esquema, token] = (req.headers.authorization ?? '').split(' ');
  if (esquema !== 'Bearer' || !token) throw new AppError(401, 'Token não informado');

  try {
    req.usuario = verificarToken(token);
  } catch {
    throw new AppError(401, 'Token inválido ou expirado');
  }
  next();
}

export function exigirTipo(...tipos: TipoUsuario[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.usuario || !tipos.includes(req.usuario.tipo)) {
      throw new AppError(403, 'Sem permissão para esta ação');
    }
    next();
  };
}

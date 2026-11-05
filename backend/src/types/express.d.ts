import type { TipoUsuario } from '../models/Usuario';

declare global {
  namespace Express {
    interface Request {
      usuario?: { id: number; tipo: TipoUsuario };
    }
  }
}

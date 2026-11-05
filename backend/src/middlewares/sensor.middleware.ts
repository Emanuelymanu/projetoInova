import { createHash, timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

const sha256 = (valor: string) => createHash('sha256').update(valor).digest();
const chaveEsperada = sha256(env.SENSOR_API_KEY);

/** O sensor não faz login: ele se identifica com a chave no header x-api-key. */
export function autenticarSensor(req: Request, _res: Response, next: NextFunction) {
  const chave = req.header('x-api-key');
  if (!chave || !timingSafeEqual(sha256(chave), chaveEsperada)) {
    throw new AppError(401, 'Chave do sensor inválida');
  }
  next();
}

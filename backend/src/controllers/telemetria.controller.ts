import type { Request, Response } from 'express';
import * as telemetriaService from '../services/telemetria.service';
import { telemetriaSchema } from '../validators/telemetria.validator';

export async function registrar(req: Request, res: Response) {
  const dados = telemetriaSchema.parse(req.body);
  res.status(201).json(await telemetriaService.registrarLeitura(dados));
}

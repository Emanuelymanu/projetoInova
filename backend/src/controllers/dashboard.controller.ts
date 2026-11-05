import type { Request, Response } from 'express';
import * as dashboardService from '../services/dashboard.service';
import { filtroZonaSchema } from '../validators/lixeira.validator';

export async function obter(req: Request, res: Response) {
  const { zonaId } = filtroZonaSchema.parse(req.query);
  res.json(await dashboardService.obterDashboard(zonaId));
}

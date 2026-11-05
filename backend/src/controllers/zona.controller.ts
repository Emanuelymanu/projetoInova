import type { Request, Response } from 'express';
import * as zonaService from '../services/zona.service';

export async function listar(_req: Request, res: Response) {
  res.json(await zonaService.listarZonas());
}

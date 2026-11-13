import type { Request, Response } from 'express';
import * as zonaService from '../services/zona.service';
import { idParamSchema } from '../validators/lixeira.validator';
import { atualizarZonaSchema, criarZonaSchema } from '../validators/zona.validator';

export async function listar(_req: Request, res: Response) {
  res.json(await zonaService.listarZonas());
}

export async function criar(req: Request, res: Response) {
  const dados = criarZonaSchema.parse(req.body);
  res.status(201).json(await zonaService.criarZona(dados));
}

export async function atualizar(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const dados = atualizarZonaSchema.parse(req.body);
  res.json(await zonaService.atualizarZona(id, dados));
}

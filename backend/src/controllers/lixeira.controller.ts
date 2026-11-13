import type { Request, Response } from 'express';
import * as lixeiraService from '../services/lixeira.service';
import {
  atualizarLixeiraSchema,
  criarLixeiraSchema,
  filtroZonaSchema,
  historicoQuerySchema,
  idParamSchema,
} from '../validators/lixeira.validator';

export async function listar(req: Request, res: Response) {
  const { zonaId } = filtroZonaSchema.parse(req.query);
  res.json(await lixeiraService.listarLixeiras(zonaId));
}

export async function buscar(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  res.json(await lixeiraService.buscarLixeira(id));
}

export async function criar(req: Request, res: Response) {
  const dados = criarLixeiraSchema.parse(req.body);
  res.status(201).json(await lixeiraService.criarLixeira(dados));
}

export async function historico(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const { horas } = historicoQuerySchema.parse(req.query);
  res.json(await lixeiraService.listarHistorico(id, horas));
}

export async function atualizar(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const dados = atualizarLixeiraSchema.parse(req.body);
  res.json(await lixeiraService.atualizarLixeira(id, dados));
}

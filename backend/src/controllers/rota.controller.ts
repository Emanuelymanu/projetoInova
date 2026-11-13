import type { Request, Response } from 'express';
import * as rotaService from '../services/rota.service';
import { idParamSchema } from '../validators/lixeira.validator';
import {
  criarRotaSchema,
  filtroRotasSchema,
  leituraRfidSchema,
  marcarParadaSchema,
  paradaParamSchema,
} from '../validators/rota.validator';

export async function listar(req: Request, res: Response) {
  const filtro = filtroRotasSchema.parse(req.query);
  res.json(await rotaService.listarRotas(filtro, req.usuario!));
}

export async function atual(req: Request, res: Response) {
  res.json(await rotaService.rotaAtual(req.usuario!.id));
}

export async function buscar(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  res.json(await rotaService.buscarRota(id, req.usuario!));
}

export async function criar(req: Request, res: Response) {
  const dados = criarRotaSchema.parse(req.body);
  res.status(201).json(await rotaService.criarRota(dados));
}

export async function iniciar(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  res.json(await rotaService.iniciarRota(id, req.usuario!));
}

export async function marcarParada(req: Request, res: Response) {
  const { id, paradaId } = paradaParamSchema.parse(req.params);
  const { coletado } = marcarParadaSchema.parse(req.body);
  res.json(await rotaService.marcarParada(id, paradaId, coletado, req.usuario!));
}

export async function finalizar(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  res.json(await rotaService.finalizarRota(id, req.usuario!));
}

export async function cancelar(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  res.json(await rotaService.cancelarRota(id));
}

export async function leituraRfid(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const { epc } = leituraRfidSchema.parse(req.body);
  res.json(await rotaService.registrarLeituraRfid(id, epc, req.usuario!));
}

import type { Request, Response } from 'express';
import * as usuarioService from '../services/usuario.service';
import { idParamSchema } from '../validators/lixeira.validator';
import {
  atualizarUsuarioSchema,
  criarUsuarioSchema,
  filtroUsuariosSchema,
} from '../validators/usuario.validator';

export async function listar(req: Request, res: Response) {
  const { tipo } = filtroUsuariosSchema.parse(req.query);
  res.json(await usuarioService.listarUsuarios(tipo));
}

export async function criar(req: Request, res: Response) {
  const { tipo, ...dados } = criarUsuarioSchema.parse(req.body);
  res.status(201).json(await usuarioService.criarUsuario(dados, tipo));
}

export async function atualizar(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const dados = atualizarUsuarioSchema.parse(req.body);
  res.json(await usuarioService.atualizarUsuario(id, dados, req.usuario!.id));
}

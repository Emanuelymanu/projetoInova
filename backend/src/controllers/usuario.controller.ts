import type { Request, Response } from 'express';
import * as usuarioService from '../services/usuario.service';
import { criarUsuarioSchema } from '../validators/usuario.validator';

export async function criar(req: Request, res: Response) {
  const { tipo, ...dados } = criarUsuarioSchema.parse(req.body);
  res.status(201).json(await usuarioService.criarUsuario(dados, tipo));
}

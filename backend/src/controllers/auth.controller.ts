import type { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import * as usuarioService from '../services/usuario.service';
import { cadastroSchema, loginSchema } from '../validators/usuario.validator';

export async function cadastrar(req: Request, res: Response) {
  const dados = cadastroSchema.parse(req.body);
  // Cadastro público nunca cria gestor; isso exige POST /api/usuarios autenticado como gestor.
  const usuario = await usuarioService.criarUsuario(dados, 'MOTORISTA');
  res.status(201).json({ usuario, token: authService.gerarToken(usuario) });
}

export async function login(req: Request, res: Response) {
  const dados = loginSchema.parse(req.body);
  res.json(await authService.login(dados));
}

export async function perfil(req: Request, res: Response) {
  res.json(await usuarioService.buscarUsuario(req.usuario!.id));
}

import bcrypt from 'bcryptjs';
import { BCRYPT_CUSTO } from '../config/constants';
import { Usuario } from '../models';
import type { TipoUsuario } from '../models/Usuario';
import { AppError } from '../utils/AppError';
import type { CadastroInput } from '../validators/usuario.validator';

/** Nunca expõe o hash da senha. */
export function paraUsuarioDTO(usuario: Usuario) {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    tipo: usuario.tipo,
    criado_em: usuario.criado_em,
  };
}

export async function criarUsuario(dados: CadastroInput, tipo: TipoUsuario) {
  const existente = await Usuario.findOne({ where: { email: dados.email } });
  if (existente) throw new AppError(409, 'E-mail já cadastrado');

  const senha_hash = await bcrypt.hash(dados.senha, BCRYPT_CUSTO);
  const usuario = await Usuario.create({
    nome: dados.nome,
    email: dados.email,
    senha_hash,
    tipo,
  });
  return paraUsuarioDTO(usuario);
}

export async function buscarUsuario(id: number) {
  const usuario = await Usuario.findByPk(id);
  if (!usuario) throw new AppError(401, 'Sessão inválida');
  return paraUsuarioDTO(usuario);
}

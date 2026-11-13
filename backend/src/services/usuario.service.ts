import bcrypt from 'bcryptjs';
import { Op, QueryTypes } from 'sequelize';
import { BCRYPT_CUSTO } from '../config/constants';
import { sequelize } from '../config/database';
import { Rota, RotaParada, Usuario } from '../models';
import type { TipoUsuario } from '../models/Usuario';
import { AppError } from '../utils/AppError';
import { hojeISO } from '../utils/geo';
import type { AtualizarUsuarioInput, CadastroInput } from '../validators/usuario.validator';

/** Nunca expõe o hash da senha. */
export function paraUsuarioDTO(usuario: Usuario) {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    tipo: usuario.tipo,
    ativo: usuario.ativo,
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
  if (!usuario || !usuario.ativo) throw new AppError(401, 'Sessão inválida');
  return paraUsuarioDTO(usuario);
}

interface Desempenho {
  motorista_id: number;
  rotas_concluidas: number;
  coletas: number;
  pontos_nao_coletados: number;
  coletas_por_tag: number;
  coletas_comprovadas: number;
}

/** Lista usuários com o desempenho de cada um nas rotas concluídas e a rota de hoje. */
export async function listarUsuarios(tipo?: TipoUsuario) {
  const usuarios = await Usuario.findAll({
    where: tipo ? { tipo } : {},
    order: [['ativo', 'DESC'], ['nome', 'ASC']],
  });

  const desempenho = await sequelize.query<Desempenho>(
    `SELECT r.motorista_id,
            COUNT(DISTINCT r.id) AS rotas_concluidas,
            COALESCE(SUM(p.coletado), 0) AS coletas,
            COALESCE(SUM(1 - p.coletado), 0) AS pontos_nao_coletados,
            COALESCE(SUM(p.coletado AND p.confirmacao = 'RFID'), 0) AS coletas_por_tag,
            -- Comprovada: tag lida no local ou esvaziamento visto pelo sensor.
            COALESCE(SUM(p.coletado AND (p.confirmacao = 'RFID' OR p.esvaziada_em IS NOT NULL)), 0) AS coletas_comprovadas
       FROM rotas r
       LEFT JOIN rota_paradas p ON p.rota_id = r.id
      WHERE r.status = 'CONCLUIDA' AND r.motorista_id IS NOT NULL
      GROUP BY r.motorista_id`,
    { type: QueryTypes.SELECT },
  );
  const porMotorista = new Map(desempenho.map((d) => [Number(d.motorista_id), d]));

  const rotasHoje = await Rota.findAll({
    where: { data_rota: hojeISO(), status: { [Op.ne]: 'CANCELADA' } },
    include: [{ model: RotaParada, as: 'paradas', attributes: ['coletado'] }],
    order: [['id', 'DESC']],
  });

  return usuarios.map((usuario) => {
    const d = porMotorista.get(usuario.id);
    const rotaHoje = rotasHoje.find((r) => r.motorista_id === usuario.id);
    return {
      ...paraUsuarioDTO(usuario),
      desempenho: {
        rotas_concluidas: Number(d?.rotas_concluidas ?? 0),
        coletas: Number(d?.coletas ?? 0),
        pontos_nao_coletados: Number(d?.pontos_nao_coletados ?? 0),
        coletas_por_tag: Number(d?.coletas_por_tag ?? 0),
        coletas_comprovadas: Number(d?.coletas_comprovadas ?? 0),
      },
      rota_hoje: rotaHoje
        ? {
            id: rotaHoje.id,
            status: rotaHoje.status,
            total_paradas: rotaHoje.paradas?.length ?? 0,
            coletadas: rotaHoje.paradas?.filter((p) => p.coletado).length ?? 0,
          }
        : null,
    };
  });
}

export async function atualizarUsuario(id: number, dados: AtualizarUsuarioInput, quemAltera: number) {
  const usuario = await Usuario.findByPk(id);
  if (!usuario) throw new AppError(404, 'Usuário não encontrado');
  if (dados.ativo === false && id === quemAltera) {
    throw new AppError(400, 'Você não pode desativar a sua própria conta');
  }

  const { senha, ...resto } = dados;
  await usuario.update({
    ...resto,
    ...(senha ? { senha_hash: await bcrypt.hash(senha, BCRYPT_CUSTO) } : {}),
  });
  return paraUsuarioDTO(usuario);
}

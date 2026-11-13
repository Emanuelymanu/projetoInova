import { Op } from 'sequelize';
import { MAX_PONTOS_HISTORICO, MINUTOS_SEM_SINAL } from '../config/constants';
import { sequelize } from '../config/database';
import { HistoricoTelemetria, Lixeira, Zona } from '../models';
import { AppError } from '../utils/AppError';
import { classificarSituacao } from '../utils/nivel';
import type { AtualizarLixeiraInput, CriarLixeiraInput } from '../validators/lixeira.validator';

const INCLUIR_ZONA = { model: Zona, as: 'zona', attributes: ['id', 'nome'] };

export function paraLixeiraDTO(lixeira: Lixeira) {
  const minutosDesdeLeitura = (Date.now() - lixeira.ultima_atualizacao.getTime()) / 60_000;
  return {
    id: lixeira.id,
    codigo_identificador: lixeira.codigo_identificador,
    epc: lixeira.epc,
    endereco: lixeira.endereco,
    // O driver devolve DECIMAL como string.
    latitude: Number(lixeira.latitude),
    longitude: Number(lixeira.longitude),
    capacidade_litros: lixeira.capacidade_litros,
    altura_cm: lixeira.altura_cm,
    nivel_preenchimento_pct: lixeira.nivel_preenchimento_pct,
    nivel_bateria_pct: lixeira.nivel_bateria_pct,
    situacao: classificarSituacao(lixeira.nivel_preenchimento_pct),
    sem_sinal: minutosDesdeLeitura > MINUTOS_SEM_SINAL,
    status: lixeira.status,
    zona: lixeira.zona ? { id: lixeira.zona.id, nome: lixeira.zona.nome } : null,
    ultima_atualizacao: lixeira.ultima_atualizacao,
    ultimo_esvaziamento: lixeira.ultimo_esvaziamento,
  };
}

export type LixeiraDTO = ReturnType<typeof paraLixeiraDTO>;

export async function listarLixeiras(zonaId?: number) {
  const lixeiras = await Lixeira.findAll({
    where: zonaId ? { zona_id: zonaId } : {},
    include: [INCLUIR_ZONA],
    order: [['nivel_preenchimento_pct', 'DESC'], ['codigo_identificador', 'ASC']],
  });
  return lixeiras.map(paraLixeiraDTO);
}

export async function buscarLixeira(id: number) {
  const lixeira = await Lixeira.findByPk(id, { include: [INCLUIR_ZONA] });
  if (!lixeira) throw new AppError(404, 'Lixeira não encontrada');
  return paraLixeiraDTO(lixeira);
}

export async function criarLixeira(dados: CriarLixeiraInput) {
  const { id } = await Lixeira.create({
    ...dados,
    endereco: dados.endereco ?? null,
    epc: dados.epc ?? null,
    ultimo_esvaziamento: null,
    zona_id: dados.zona_id ?? null,
    localizacao: pontoGeografico(dados.latitude, dados.longitude),
  });
  return buscarLixeira(id);
}

function pontoGeografico(latitude: number, longitude: number) {
  // axis-order explícito: para o SRID 4326 o MySQL assume latitude primeiro.
  return sequelize.fn(
    'ST_PointFromText',
    `POINT(${longitude} ${latitude})`,
    4326,
    'axis-order=long-lat',
  );
}

export async function atualizarLixeira(id: number, dados: AtualizarLixeiraInput) {
  const lixeira = await Lixeira.findByPk(id);
  if (!lixeira) throw new AppError(404, 'Lixeira não encontrada');

  const { latitude, longitude, ...resto } = dados;
  const mudancas: Record<string, unknown> = { ...resto };
  if (latitude !== undefined && longitude !== undefined) {
    Object.assign(mudancas, { latitude, longitude, localizacao: pontoGeografico(latitude, longitude) });
  }
  lixeira.set(mudancas);
  // Reenvia a data atual: sem ela, o ON UPDATE do MySQL trataria a edição como leitura do sensor.
  lixeira.changed('ultima_atualizacao', true);
  await lixeira.save();
  return buscarLixeira(id);
}

export async function listarHistorico(lixeiraId: number, horas: number) {
  await buscarLixeira(lixeiraId);

  const registros = await HistoricoTelemetria.findAll({
    where: {
      lixeira_id: lixeiraId,
      data_hora: { [Op.gte]: new Date(Date.now() - horas * 3_600_000) },
    },
    attributes: ['nivel_preenchimento_pct', 'nivel_bateria_pct', 'distancia_cm', 'data_hora'],
    // DATETIME tem precisão de 1 segundo; o id desempata leituras no mesmo segundo.
    order: [['data_hora', 'DESC'], ['id', 'DESC']],
    limit: MAX_PONTOS_HISTORICO,
  });
  return registros.reverse();
}

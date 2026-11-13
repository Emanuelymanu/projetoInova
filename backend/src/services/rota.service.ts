import { Op, type WhereOptions } from 'sequelize';
import { MINUTOS_POR_PARADA, VELOCIDADE_MEDIA_KMH } from '../config/constants';
import { sequelize } from '../config/database';
import { Lixeira, Rota, RotaParada, Usuario, Zona } from '../models';
import type { TipoUsuario } from '../models/Usuario';
import { AppError } from '../utils/AppError';
import { distanciaKm, hojeISO } from '../utils/geo';
import type { CriarRotaInput, FiltroRotasInput } from '../validators/rota.validator';
import { normalizarEpc } from '../validators/lixeira.validator';
import { verificacaoSensor } from './comprovacao.service';
import { paraLixeiraDTO } from './lixeira.service';

type Solicitante = { id: number; tipo: TipoUsuario };

const INCLUIR_COMPLETO = [
  { model: Usuario, as: 'motorista', attributes: ['id', 'nome', 'email'] },
  {
    model: RotaParada,
    as: 'paradas',
    include: [{ model: Lixeira, as: 'lixeira', include: [{ model: Zona, as: 'zona', attributes: ['id', 'nome'] }] }],
  },
];

/** "Rota Centro Histórico": nome da zona com mais pontos na rota. */
function nomeDaRota(paradas: RotaParada[]): string {
  const contagem = new Map<string, number>();
  for (const p of paradas) {
    const zona = p.lixeira?.zona?.nome;
    if (zona) contagem.set(zona, (contagem.get(zona) ?? 0) + 1);
  }
  const [maisComum] = [...contagem.entries()].sort((a, b) => b[1] - a[1]);
  return maisComum ? `Rota ${maisComum[0]}` : 'Rota sem zona';
}

export function paraRotaDTO(rota: Rota) {
  const paradas = [...(rota.paradas ?? [])].sort((a, b) => a.ordem_visita - b.ordem_visita);
  const coletadas = paradas.filter((p) => p.coletado).length;
  const agora = Date.now();
  const comVerificacao = paradas.map((p) => ({ parada: p, sensor: verificacaoSensor(p, agora) }));
  return {
    id: rota.id,
    nome: nomeDaRota(paradas),
    data_rota: rota.data_rota,
    status: rota.status,
    motorista: rota.motorista ? { id: rota.motorista.id, nome: rota.motorista.nome, email: rota.motorista.email } : null,
    distancia_total_km: rota.distancia_total_km === null ? null : Number(rota.distancia_total_km),
    tempo_estimado_min: rota.tempo_estimado_min,
    iniciada_em: rota.iniciada_em,
    concluida_em: rota.concluida_em,
    criado_em: rota.criado_em,
    total_paradas: paradas.length,
    coletadas,
    // Comprovada = a tag foi lida no local ou o sensor viu a lixeira ser esvaziada.
    comprovadas: comVerificacao.filter(({ parada: p, sensor }) => p.coletado && (p.confirmacao === 'RFID' || sensor === 'CONFIRMADA')).length,
    paradas: comVerificacao.map(({ parada: p, sensor }) => ({
      id: p.id,
      ordem_visita: p.ordem_visita,
      coletado: Boolean(p.coletado),
      data_hora_coleta: p.data_hora_coleta,
      confirmacao: p.coletado ? p.confirmacao : null,
      epc_lido: p.epc_lido,
      nivel_na_coleta: p.nivel_na_coleta,
      esvaziada_em: p.esvaziada_em,
      verificacao_sensor: sensor,
      lixeira: p.lixeira ? paraLixeiraDTO(p.lixeira) : null,
    })),
  };
}

export type RotaDTO = ReturnType<typeof paraRotaDTO>;

export async function listarRotas(filtro: FiltroRotasInput, solicitante: Solicitante) {
  const where: WhereOptions = {};
  if (filtro.status) Object.assign(where, { status: filtro.status });
  if (filtro.data) Object.assign(where, { data_rota: filtro.data });
  else if (filtro.de || filtro.ate) {
    Object.assign(where, {
      data_rota: { ...(filtro.de && { [Op.gte]: filtro.de }), ...(filtro.ate && { [Op.lte]: filtro.ate }) },
    });
  }
  // Motorista só vê as próprias rotas, qualquer que seja o filtro pedido.
  const motoristaId = solicitante.tipo === 'MOTORISTA' ? solicitante.id : filtro.motoristaId;
  if (motoristaId) Object.assign(where, { motorista_id: motoristaId });

  const rotas = await Rota.findAll({
    where,
    include: INCLUIR_COMPLETO,
    order: [['data_rota', 'DESC'], ['id', 'DESC']],
    limit: 200,
  });
  return rotas.map(paraRotaDTO);
}

async function carregarRota(id: number) {
  const rota = await Rota.findByPk(id, { include: INCLUIR_COMPLETO });
  if (!rota) throw new AppError(404, 'Rota não encontrada');
  return rota;
}

function garantirAcesso(rota: Rota, solicitante: Solicitante) {
  if (solicitante.tipo === 'MOTORISTA' && rota.motorista_id !== solicitante.id) {
    throw new AppError(403, 'Esta rota é de outro motorista');
  }
}

export async function buscarRota(id: number, solicitante: Solicitante) {
  const rota = await carregarRota(id);
  garantirAcesso(rota, solicitante);
  return paraRotaDTO(rota);
}

/**
 * Rota que o motorista deve fazer agora: a que está em andamento ou, se nenhuma,
 * a planejada mais antiga até hoje. Rotas de dias futuros ainda não aparecem.
 */
export async function rotaAtual(motoristaId: number) {
  const abertas = await Rota.findAll({
    where: {
      motorista_id: motoristaId,
      status: { [Op.in]: ['PLANEJADA', 'EM_ANDAMENTO'] },
      data_rota: { [Op.lte]: hojeISO() },
    },
    attributes: ['id', 'status'],
    order: [['data_rota', 'ASC'], ['id', 'ASC']],
  });
  const escolhida = abertas.find((r) => r.status === 'EM_ANDAMENTO') ?? abertas[0];
  return escolhida ? paraRotaDTO(await carregarRota(escolhida.id)) : null;
}

export async function criarRota(dados: CriarRotaInput) {
  const motorista = await Usuario.findByPk(dados.motorista_id);
  if (!motorista || motorista.tipo !== 'MOTORISTA') throw new AppError(400, 'Motorista não encontrado');
  if (!motorista.ativo) throw new AppError(400, 'Este motorista está desativado');

  const lixeiras = await Lixeira.findAll({ where: { id: dados.lixeira_ids } });
  if (lixeiras.length !== dados.lixeira_ids.length) throw new AppError(400, 'Alguma lixeira não foi encontrada');
  if (lixeiras.some((l) => l.status === 'DESATIVADO')) {
    throw new AppError(400, 'Lixeiras desativadas não podem entrar em rotas');
  }

  const porId = new Map(lixeiras.map((l) => [l.id, l]));
  const ordenadas = dados.lixeira_ids.map((id) => porId.get(id)!);
  let distancia = 0;
  for (let i = 1; i < ordenadas.length; i++) distancia += distanciaKm(ordenadas[i - 1], ordenadas[i]);
  const tempo = Math.round((distancia / VELOCIDADE_MEDIA_KMH) * 60 + ordenadas.length * MINUTOS_POR_PARADA);

  const id = await sequelize.transaction(async (transaction) => {
    const rota = await Rota.create(
      {
        motorista_id: motorista.id,
        data_rota: dados.data_rota,
        distancia_total_km: Math.round(distancia * 100) / 100,
        tempo_estimado_min: tempo,
        iniciada_em: null,
        concluida_em: null,
      },
      { transaction },
    );
    await RotaParada.bulkCreate(
      ordenadas.map((l, i) => ({
        rota_id: rota.id,
        lixeira_id: l.id,
        ordem_visita: i + 1,
        data_hora_coleta: null,
        confirmacao: null,
        epc_lido: null,
        nivel_na_coleta: null,
        esvaziada_em: null,
      })),
      { transaction },
    );
    return rota.id;
  });
  return paraRotaDTO(await carregarRota(id));
}

function garantirAberta(rota: Rota) {
  if (rota.status === 'CONCLUIDA' || rota.status === 'CANCELADA') {
    throw new AppError(409, `Esta rota já está ${rota.status === 'CONCLUIDA' ? 'concluída' : 'cancelada'}`);
  }
}

export async function iniciarRota(id: number, solicitante: Solicitante) {
  const rota = await carregarRota(id);
  garantirAcesso(rota, solicitante);
  garantirAberta(rota);
  if (rota.status === 'PLANEJADA') await rota.update({ status: 'EM_ANDAMENTO', iniciada_em: new Date() });
  return paraRotaDTO(await carregarRota(id));
}

export async function marcarParada(rotaId: number, paradaId: number, coletado: boolean, solicitante: Solicitante) {
  const rota = await carregarRota(rotaId);
  garantirAcesso(rota, solicitante);
  garantirAberta(rota);

  const parada = rota.paradas?.find((p) => p.id === paradaId);
  if (!parada) throw new AppError(404, 'Ponto não encontrado nesta rota');

  if (coletado) await registrarColeta(rota, parada, 'MANUAL', null);
  else {
    // Desfazer apaga a marcação, mas mantém a prova do sensor, se houver.
    await parada.update({ coletado: false, data_hora_coleta: null, confirmacao: null, epc_lido: null, nivel_na_coleta: null });
  }
  return paraRotaDTO(await carregarRota(rotaId));
}

async function registrarColeta(rota: Rota, parada: RotaParada, confirmacao: 'MANUAL' | 'RFID', epc: string | null) {
  const agora = new Date();
  await sequelize.transaction(async (transaction) => {
    await parada.update(
      {
        coletado: true,
        data_hora_coleta: agora,
        confirmacao,
        epc_lido: epc,
        // Guardado para saber se dá para esperar a queda de nível no sensor.
        nivel_na_coleta: parada.lixeira?.nivel_preenchimento_pct ?? null,
      },
      { transaction },
    );
    // Marcar o primeiro ponto já coloca a rota em andamento.
    if (rota.status === 'PLANEJADA') {
      await rota.update({ status: 'EM_ANDAMENTO', iniciada_em: agora }, { transaction });
    }
  });
}

/**
 * O leitor UHF leu uma tag: registra a coleta da lixeira correspondente nesta rota.
 * Tags de lixeiras fora da rota são recusadas, porque o leitor alcança alguns metros
 * e pode pegar a lixeira vizinha.
 */
export async function registrarLeituraRfid(rotaId: number, epcLido: string, solicitante: Solicitante) {
  const epc = normalizarEpc(epcLido);
  const rota = await carregarRota(rotaId);
  garantirAcesso(rota, solicitante);
  garantirAberta(rota);

  const parada = rota.paradas?.find((p) => p.lixeira?.epc === epc);
  if (!parada) {
    const lixeira = await Lixeira.findOne({ where: { epc }, attributes: ['codigo_identificador'] });
    throw new AppError(
      lixeira ? 409 : 404,
      lixeira
        ? `A tag é da lixeira ${lixeira.codigo_identificador}, que não está nesta rota`
        : 'Tag não cadastrada em nenhuma lixeira',
    );
  }

  const jaColetada = Boolean(parada.coletado) && parada.confirmacao === 'RFID';
  if (!jaColetada) {
    if (parada.coletado) {
      // Já marcada à mão ou pelo sensor: a leitura da tag reforça a prova.
      await parada.update({ confirmacao: 'RFID', epc_lido: epc });
    } else {
      await registrarColeta(rota, parada, 'RFID', epc);
    }
  }
  return {
    lixeira: parada.lixeira!.codigo_identificador,
    parada_id: parada.id,
    ja_registrada: jaColetada,
    rota: paraRotaDTO(await carregarRota(rotaId)),
  };
}

export async function finalizarRota(id: number, solicitante: Solicitante) {
  const rota = await carregarRota(id);
  garantirAcesso(rota, solicitante);
  garantirAberta(rota);
  await rota.update({
    status: 'CONCLUIDA',
    iniciada_em: rota.iniciada_em ?? new Date(),
    concluida_em: new Date(),
  });
  return paraRotaDTO(await carregarRota(id));
}

export async function cancelarRota(id: number) {
  const rota = await carregarRota(id);
  garantirAberta(rota);
  await rota.update({ status: 'CANCELADA' });
  return paraRotaDTO(await carregarRota(id));
}

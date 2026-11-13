import { Op, type Transaction } from 'sequelize';
import {
  JANELA_CONFIRMACAO_SENSOR_MIN,
  NIVEL_MAXIMO_APOS_ESVAZIAMENTO_PCT,
  QUEDA_MINIMA_ESVAZIAMENTO_PCT,
} from '../config/constants';
import { Lixeira, Rota, RotaParada } from '../models';
import { hojeISO } from '../utils/geo';

/**
 * Como o sensor ultrassônico confirma (ou não) uma coleta marcada:
 * - CONFIRMADA: o nível despencou depois da coleta;
 * - AGUARDANDO: ainda dentro da janela, esperando a próxima leitura;
 * - SEM_LEITURA: a janela passou e o sensor não mandou leitura nenhuma depois da coleta;
 * - NAO_DETECTADA: houve leitura depois da coleta, mas sem queda de nível (vale conferir);
 * - NAO_APLICAVEL: a lixeira estava quase vazia, então não há queda a esperar.
 */
export type VerificacaoSensor = 'CONFIRMADA' | 'AGUARDANDO' | 'SEM_LEITURA' | 'NAO_DETECTADA' | 'NAO_APLICAVEL';

export function houveEsvaziamento(nivelAntes: number, nivelDepois: number) {
  return nivelAntes - nivelDepois >= QUEDA_MINIMA_ESVAZIAMENTO_PCT && nivelDepois <= NIVEL_MAXIMO_APOS_ESVAZIAMENTO_PCT;
}

export function verificacaoSensor(parada: RotaParada, agora = Date.now()): VerificacaoSensor | null {
  if (!parada.coletado || !parada.data_hora_coleta) return null;
  if (parada.esvaziada_em) return 'CONFIRMADA';
  if (parada.nivel_na_coleta !== null && parada.nivel_na_coleta < QUEDA_MINIMA_ESVAZIAMENTO_PCT) return 'NAO_APLICAVEL';

  const coletadaEm = parada.data_hora_coleta.getTime();
  if (agora - coletadaEm < JANELA_CONFIRMACAO_SENSOR_MIN * 60_000) return 'AGUARDANDO';

  const ultimaLeitura = parada.lixeira?.ultima_atualizacao.getTime() ?? 0;
  return ultimaLeitura > coletadaEm ? 'NAO_DETECTADA' : 'SEM_LEITURA';
}

/**
 * Chamado quando o sensor de uma lixeira mostra que ela foi esvaziada. Anota a prova
 * nas paradas que fazem sentido:
 * - paradas já marcadas (por tag ou à mão) há pouco tempo: ganham a confirmação do sensor;
 * - parada pendente numa rota EM ANDAMENTO: passa a coletada, por SENSOR. Só quando há uma
 *   única rota em andamento com essa lixeira; se houver mais, não dá para saber quem coletou.
 * Rotas apenas planejadas não são tocadas: o motorista ainda não saiu, então a coleta não
 * foi dele e não pode entrar no desempenho dele.
 */
export async function registrarEsvaziamento(
  lixeira: Lixeira,
  nivelAntes: number,
  agora: Date,
  transaction: Transaction,
) {
  await lixeira.update({ ultimo_esvaziamento: agora }, { transaction });

  const inicioJanela = new Date(agora.getTime() - JANELA_CONFIRMACAO_SENSOR_MIN * 60_000);
  const paradas = await RotaParada.findAll({
    where: {
      lixeira_id: lixeira.id,
      esvaziada_em: null,
      [Op.or]: [
        { coletado: false, '$rota.status$': 'EM_ANDAMENTO', '$rota.data_rota$': { [Op.lte]: hojeISO() } },
        { coletado: true, data_hora_coleta: { [Op.gte]: inicioJanela }, '$rota.status$': { [Op.ne]: 'CANCELADA' } },
      ],
    },
    include: [{ model: Rota, as: 'rota', attributes: ['id', 'status', 'data_rota'] }],
    transaction,
  });

  const jaMarcadas = paradas.filter((p) => p.coletado);
  const pendentes = paradas.filter((p) => !p.coletado);

  for (const parada of jaMarcadas) await parada.update({ esvaziada_em: agora }, { transaction });

  // Se a coleta já foi marcada em alguma rota, o esvaziamento é dela: nada de pendente a marcar.
  if (jaMarcadas.length === 0 && pendentes.length === 1) {
    await pendentes[0].update(
      { coletado: true, data_hora_coleta: agora, confirmacao: 'SENSOR', nivel_na_coleta: nivelAntes, esvaziada_em: agora },
      { transaction },
    );
    return jaMarcadas.length + 1;
  }
  return jaMarcadas.length;
}

/**
 * Simula os sensores das lixeiras para demonstração: a cada intervalo, cada lixeira
 * operacional manda uma leitura para a API, como o sensor de verdade faria.
 *
 * - As lixeiras enchem aos poucos, cada uma num ritmo diferente.
 * - Quando o motorista marca uma coleta no app, a próxima leitura mostra a lixeira
 *   esvaziada, e o sistema confirma a coleta pelo sensor.
 * - A bateria cai devagar.
 *
 * Uso (com a API rodando): npm run simular            -> a cada 30 s
 *                          npm run simular -- 10      -> a cada 10 s
 */
import { Op } from 'sequelize';
import { JANELA_CONFIRMACAO_SENSOR_MIN } from '../config/constants';
import { sequelize } from '../config/database';
import { env } from '../config/env';
import { Lixeira, RotaParada } from '../models';

const INTERVALO_S = Number(process.argv[2]) > 0 ? Number(process.argv[2]) : 30;
const URL_TELEMETRIA = `http://localhost:${env.PORT}/api/telemetria`;

/** Quanto cada lixeira enche por leitura (pontos de %). Sorteado uma vez por lixeira. */
const ritmo = new Map<number, number>();
/** Paradas cujo esvaziamento já foi simulado, para não esvaziar de novo. */
const jaEsvaziadas = new Set<number>();

const sortear = (min: number, max: number) => min + Math.random() * (max - min);

async function coletasAguardandoSensor() {
  const desde = new Date(Date.now() - JANELA_CONFIRMACAO_SENSOR_MIN * 60_000);
  const paradas = await RotaParada.findAll({
    where: { coletado: true, esvaziada_em: null, data_hora_coleta: { [Op.gte]: desde } },
    attributes: ['id', 'lixeira_id'],
  });
  return paradas.filter((p) => !jaEsvaziadas.has(p.id));
}

async function enviar(codigo: string, distancia_cm: number, nivel_bateria_pct: number) {
  const resposta = await fetch(URL_TELEMETRIA, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': env.SENSOR_API_KEY },
    body: JSON.stringify({ codigo_identificador: codigo, distancia_cm, nivel_bateria_pct }),
  });
  if (!resposta.ok) throw new Error(`${resposta.status} ${await resposta.text()}`);
  return (await resposta.json()) as { nivel_preenchimento_pct: number; paradas_confirmadas: number };
}

async function rodada() {
  const lixeiras = await Lixeira.findAll({ where: { status: 'OPERACIONAL' }, order: [['codigo_identificador', 'ASC']] });
  const coletas = await coletasAguardandoSensor();
  const hora = new Date().toLocaleTimeString('pt-BR');
  const linhas: string[] = [];

  for (const lixeira of lixeiras) {
    if (!ritmo.has(lixeira.id)) ritmo.set(lixeira.id, sortear(1, 7));

    const coletasDaLixeira = coletas.filter((p) => p.lixeira_id === lixeira.id);
    const anterior = lixeira.nivel_preenchimento_pct;
    let nivel: number;
    let nota = '';

    if (coletasDaLixeira.length > 0) {
      nivel = sortear(0, 6); // caminhão passou: lixeira quase vazia
      coletasDaLixeira.forEach((p) => jaEsvaziadas.add(p.id));
      nota = 'esvaziada pelo caminhão';
    } else {
      nivel = Math.min(100, anterior + ritmo.get(lixeira.id)! * sortear(0.5, 1.5));
    }

    const altura = lixeira.altura_cm;
    const distancia = Math.max(0, Math.round(altura - (nivel / 100) * altura + sortear(-1, 1)));
    const bateria = Math.max(0, lixeira.nivel_bateria_pct - (Math.random() < 0.15 ? 1 : 0));

    try {
      const r = await enviar(lixeira.codigo_identificador, distancia, bateria);
      if (r.paradas_confirmadas > 0) nota += ' · coleta confirmada pelo sensor';
      linhas.push(
        `  ${lixeira.codigo_identificador.padEnd(10)} ${String(anterior).padStart(3)}% -> ${String(r.nivel_preenchimento_pct).padStart(3)}%  bateria ${bateria}%${nota ? `  (${nota})` : ''}`,
      );
    } catch (e) {
      linhas.push(`  ${lixeira.codigo_identificador.padEnd(10)} erro: ${(e as Error).message}`);
    }
  }

  console.log(`[${hora}] ${lixeiras.length} leituras enviadas`);
  console.log(linhas.join('\n'));
}

async function main() {
  await sequelize.authenticate();
  console.log(`Simulador de sensores: leituras a cada ${INTERVALO_S} s para ${URL_TELEMETRIA}. Ctrl+C para parar.\n`);

  let rodando = false;
  const executar = async () => {
    if (rodando) return; // não sobrepõe rodadas se a anterior demorar
    rodando = true;
    try {
      await rodada();
    } catch (e) {
      console.error('Falha na rodada:', (e as Error).message, '(a API está rodando?)');
    } finally {
      rodando = false;
    }
  };

  await executar();
  const timer = setInterval(executar, INTERVALO_S * 1000);

  process.on('SIGINT', async () => {
    clearInterval(timer);
    await sequelize.close();
    console.log('\nSimulador parado.');
    process.exit(0);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

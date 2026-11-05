import { LIMITE_BATERIA_BAIXA_PCT } from '../config/constants';
import { listarLixeiras } from './lixeira.service';

export async function obterDashboard(zonaId?: number) {
  const todas = await listarLixeiras(zonaId);
  const lixeiras = todas.filter((lixeira) => lixeira.status !== 'DESATIVADO');

  const contar = (condicao: (lixeira: (typeof lixeiras)[number]) => boolean) =>
    lixeiras.filter(condicao).length;

  return {
    resumo: {
      total: lixeiras.length,
      cheias: contar((l) => l.situacao === 'CHEIA'),
      parciais: contar((l) => l.situacao === 'PARCIAL'),
      vazias: contar((l) => l.situacao === 'VAZIA'),
      bateria_baixa: contar((l) => l.nivel_bateria_pct < LIMITE_BATERIA_BAIXA_PCT),
      sem_sinal: contar((l) => l.sem_sinal),
    },
    lixeiras,
    gerado_em: new Date(),
  };
}

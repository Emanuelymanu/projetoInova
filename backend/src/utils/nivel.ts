import { LIMITE_CHEIA_PCT, LIMITE_VAZIA_PCT } from '../config/constants';

export type Situacao = 'VAZIA' | 'PARCIAL' | 'CHEIA';

/**
 * O sensor fica na tampa e mede a distância até o lixo: quanto menor a distância,
 * mais cheia a lixeira. Leituras fora da faixa (ex.: maior que a altura) são limitadas a 0-100%.
 */
export function calcularNivelPct(distanciaCm: number, alturaCm: number): number {
  const pct = ((alturaCm - distanciaCm) / alturaCm) * 100;
  return Math.round(Math.min(100, Math.max(0, pct)));
}

export function classificarSituacao(nivelPct: number): Situacao {
  if (nivelPct >= LIMITE_CHEIA_PCT) return 'CHEIA';
  if (nivelPct <= LIMITE_VAZIA_PCT) return 'VAZIA';
  return 'PARCIAL';
}

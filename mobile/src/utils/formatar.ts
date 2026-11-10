import { cores } from '@/theme';
import type { Lixeira } from '@/services/tipos';

export type Prioridade = 'alta' | 'media' | 'baixa';

/** Mesmo limite do backend (LIMITE_CHEIA_PCT) para "precisa de coleta". */
export const LIMITE_URGENTE_PCT = 80;
export const LIMITE_ATENCAO_PCT = 50;

export function prioridadeDe(lixeira: Lixeira): Prioridade {
  const nivel = lixeira.nivel_preenchimento_pct;
  if (nivel >= LIMITE_URGENTE_PCT) return 'alta';
  if (nivel >= LIMITE_ATENCAO_PCT) return 'media';
  return 'baixa';
}

export const ESTILO_PRIORIDADE: Record<
  Prioridade,
  { rotulo: string; cor: string; fundo: string; borda: string; legenda: string }
> = {
  alta: { rotulo: 'Prioridade alta', legenda: 'Urgente', cor: cores.vermelho, fundo: cores.vermelhoFundo, borda: cores.vermelhoBorda },
  media: { rotulo: 'Atenção', legenda: 'Atenção', cor: cores.amarelo, fundo: cores.amareloFundo, borda: cores.amareloBorda },
  baixa: { rotulo: 'Normal', legenda: 'OK', cor: cores.verde, fundo: cores.verdeFundo, borda: cores.verdeBorda },
};

export function tempoDesde(dataIso: string | number, agora = Date.now()): string {
  const minutos = Math.max(0, Math.round((agora - new Date(dataIso).getTime()) / 60_000));
  if (minutos < 1) return 'agora';
  if (minutos < 60) return `há ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas} ${horas === 1 ? 'hora' : 'horas'}`;
  const dias = Math.floor(horas / 24);
  return `há ${dias} ${dias === 1 ? 'dia' : 'dias'}`;
}

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** "Seg, 17 ago" ou, com ano, "Seg, 17 ago 2025". */
export function dataCurta(data: Date | string, comAno = false): string {
  const d = new Date(data);
  const base = `${DIAS[d.getDay()]}, ${d.getDate()} ${MESES[d.getMonth()]}`;
  return comAno ? `${base} ${d.getFullYear()}` : base;
}

/** Distância em km entre dois pontos (fórmula de haversine). */
export function distanciaKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export function formatarKm(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1).replace('.', ',')} km`;
}

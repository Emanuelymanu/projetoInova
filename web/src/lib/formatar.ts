import type { Confirmacao, Lixeira, StatusLixeira, StatusRota, VerificacaoSensor } from './tipos'

export type Prioridade = 'alta' | 'media' | 'baixa'

/** Mesmo limite do backend (LIMITE_CHEIA_PCT) e do app do motorista. */
export const LIMITE_URGENTE_PCT = 80
export const LIMITE_ATENCAO_PCT = 50
export const LIMITE_BATERIA_BAIXA_PCT = 20

export function prioridadeDe(nivel: number): Prioridade {
  if (nivel >= LIMITE_URGENTE_PCT) return 'alta'
  if (nivel >= LIMITE_ATENCAO_PCT) return 'media'
  return 'baixa'
}

export const PRIORIDADE: Record<Prioridade, { rotulo: string; curto: string; tom: 'vermelho' | 'amarelo' | 'verde'; cor: string }> = {
  alta: { rotulo: 'Urgente', curto: 'Urgente', tom: 'vermelho', cor: '#EF4444' },
  media: { rotulo: 'Atenção', curto: 'Atenção', tom: 'amarelo', cor: '#FACC15' },
  baixa: { rotulo: 'OK', curto: 'OK', tom: 'verde', cor: '#22C55E' },
}

export const STATUS_ROTA: Record<StatusRota, { rotulo: string; tom: 'azul' | 'amarelo' | 'verde' | 'cinza' }> = {
  PLANEJADA: { rotulo: 'Planejada', tom: 'azul' },
  EM_ANDAMENTO: { rotulo: 'Em andamento', tom: 'amarelo' },
  CONCLUIDA: { rotulo: 'Concluída', tom: 'verde' },
  CANCELADA: { rotulo: 'Cancelada', tom: 'cinza' },
}

export const STATUS_LIXEIRA: Record<StatusLixeira, { rotulo: string; tom: 'verde' | 'amarelo' | 'cinza' }> = {
  OPERACIONAL: { rotulo: 'Operacional', tom: 'verde' },
  MANUTENCAO: { rotulo: 'Manutenção', tom: 'amarelo' },
  DESATIVADO: { rotulo: 'Desativada', tom: 'cinza' },
}

export const CONFIRMACAO: Record<Confirmacao, { rotulo: string; descricao: string }> = {
  RFID: { rotulo: 'Tag RFID', descricao: 'O leitor leu a tag da lixeira no local' },
  SENSOR: { rotulo: 'Sensor', descricao: 'O sensor viu a lixeira ser esvaziada' },
  MANUAL: { rotulo: 'Manual', descricao: 'O motorista marcou no app' },
}

export const VERIFICACAO: Record<VerificacaoSensor, { rotulo: string; tom: 'verde' | 'amarelo' | 'cinza' }> = {
  CONFIRMADA: { rotulo: 'Esvaziamento detectado', tom: 'verde' },
  AGUARDANDO: { rotulo: 'Aguardando sensor', tom: 'cinza' },
  SEM_LEITURA: { rotulo: 'Sensor sem leitura', tom: 'cinza' },
  NAO_DETECTADA: { rotulo: 'Sem queda de nível', tom: 'amarelo' },
  NAO_APLICAVEL: { rotulo: 'Estava quase vazia', tom: 'cinza' },
}

export function tempoDesde(data: string | Date, agora = Date.now()): string {
  const minutos = Math.max(0, Math.round((agora - new Date(data).getTime()) / 60_000))
  if (minutos < 1) return 'agora'
  if (minutos < 60) return `há ${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `há ${horas} h`
  const dias = Math.floor(horas / 24)
  return `há ${dias} ${dias === 1 ? 'dia' : 'dias'}`
}

export const dataHora = (valor: string | Date) =>
  new Date(valor).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

export const hora = (valor: string | Date) => new Date(valor).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

/** "2026-11-12" -> "qui., 12 de nov." sem deslocar o dia pelo fuso. */
export function dataRota(iso: string, comAno = false): string {
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(a, m - 1, d).toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(comAno ? { year: 'numeric' } : {}),
  })
}

/** Data local no formato AAAA-MM-DD. */
export function hojeISO(): string {
  return new Date().toLocaleDateString('sv')
}

export function formatarKm(km: number | null): string {
  if (km === null) return '–'
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1).replace('.', ',')} km`
}

export function formatarMinutos(min: number | null): string {
  if (min === null) return '–'
  if (min < 60) return `${min} min`
  return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}`
}

type Ponto = { latitude: number; longitude: number }

export function distanciaKm(a: Ponto, b: Ponto): number {
  const rad = (g: number) => (g * Math.PI) / 180
  const dLat = rad(b.latitude - a.latitude)
  const dLon = rad(b.longitude - a.longitude)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(h))
}

/**
 * Ordem de visita sugerida: começa pela lixeira mais cheia e segue sempre para a mais
 * próxima ainda não visitada (vizinho mais próximo). Não é a rota ótima, mas evita zigue-zague.
 */
export function ordenarPorProximidade<T extends Lixeira>(lixeiras: T[]): T[] {
  if (lixeiras.length < 3) return [...lixeiras].sort((a, b) => b.nivel_preenchimento_pct - a.nivel_preenchimento_pct)
  const restantes = [...lixeiras].sort((a, b) => b.nivel_preenchimento_pct - a.nivel_preenchimento_pct)
  const ordem = [restantes.shift()!]
  while (restantes.length) {
    const ultimo = ordem[ordem.length - 1]
    let maisPerto = 0
    for (let i = 1; i < restantes.length; i++) {
      if (distanciaKm(ultimo, restantes[i]) < distanciaKm(ultimo, restantes[maisPerto])) maisPerto = i
    }
    ordem.push(restantes.splice(maisPerto, 1)[0])
  }
  return ordem
}

export function distanciaTotal(pontos: Ponto[]): number {
  let total = 0
  for (let i = 1; i < pontos.length; i++) total += distanciaKm(pontos[i - 1], pontos[i])
  return total
}

export function iniciais(nome: string): string {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}

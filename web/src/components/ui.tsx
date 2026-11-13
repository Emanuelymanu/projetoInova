import { Activity, AlertCircle, CheckCircle2, CircleAlert, Hand, Loader2, ScanLine, TriangleAlert, X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { CONFIRMACAO, PRIORIDADE, prioridadeDe, VERIFICACAO, type Prioridade } from '../lib/formatar'
import type { Parada } from '../lib/tipos'

type Tom = 'vermelho' | 'amarelo' | 'verde' | 'azul' | 'cinza'

export function Selo({ tom, children, ponto = false }: { tom: Tom; children: ReactNode; ponto?: boolean }) {
  return (
    <span className={`selo tom-${tom}`}>
      {ponto && <span className="selo-ponto" aria-hidden />}
      {children}
    </span>
  )
}

const ICONE_PRIORIDADE: Record<Prioridade, typeof CircleAlert> = {
  alta: TriangleAlert,
  media: CircleAlert,
  baixa: CheckCircle2,
}

/** Prioridade sempre com ícone e texto: a cor nunca carrega o significado sozinha. */
export function SeloPrioridade({ nivel }: { nivel: number }) {
  const p = prioridadeDe(nivel)
  const Icone = ICONE_PRIORIDADE[p]
  return (
    <Selo tom={PRIORIDADE[p].tom}>
      <Icone size={13} aria-hidden />
      {PRIORIDADE[p].rotulo}
    </Selo>
  )
}

export function Barra({ pct, cor }: { pct: number; cor: string }) {
  return (
    <div className="barra" role="presentation">
      <span style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: cor }} />
    </div>
  )
}

/** Barra de nível colorida pela prioridade, com o valor ao lado. */
export function Nivel({ pct }: { pct: number }) {
  return (
    <div className="nivel" aria-label={`Nível ${pct}%`}>
      <Barra pct={pct} cor={PRIORIDADE[prioridadeDe(pct)].cor} />
      <span className="nivel-valor">{pct}%</span>
    </div>
  )
}

export function Carregando({ texto = 'Carregando…' }: { texto?: string }) {
  return (
    <div className="carregando" role="status">
      <Loader2 className="girando" size={22} aria-hidden />
      {texto}
    </div>
  )
}

export function Vazio({ icone, children }: { icone: ReactNode; children: ReactNode }) {
  return (
    <div className="vazio">
      {icone}
      <div>{children}</div>
    </div>
  )
}

export function MensagemErro({ children }: { children: ReactNode }) {
  return (
    <div className="mensagem erro" role="alert">
      <AlertCircle size={16} aria-hidden />
      <span>{children}</span>
    </div>
  )
}

export function Indicador({
  rotulo,
  valor,
  detalhe,
  icone,
  destaque = false,
}: {
  rotulo: string
  valor: ReactNode
  detalhe?: ReactNode
  icone?: ReactNode
  destaque?: boolean
}) {
  return (
    <div className={`indicador${destaque ? ' destaque' : ''}`}>
      <span className="indicador-rotulo">
        {icone}
        {rotulo}
      </span>
      <span className="indicador-valor">{valor}</span>
      {detalhe && <span className="indicador-detalhe">{detalhe}</span>}
    </div>
  )
}

export function Modal({ titulo, aoFechar, children }: { titulo: string; aoFechar: () => void; children: ReactNode }) {
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar()
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [aoFechar])

  return (
    <div className="modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && aoFechar()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={titulo}>
        <div className="modal-topo">
          <h2>{titulo}</h2>
          <button type="button" className="botao-icone" onClick={aoFechar} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        <div className="modal-corpo">{children}</div>
      </div>
    </div>
  )
}

const ICONE_CONFIRMACAO = { RFID: ScanLine, SENSOR: Activity, MANUAL: Hand }

/**
 * Como uma coleta foi comprovada: a origem (tag, sensor ou manual) e, quando a origem não
 * é o próprio sensor, o que o sensor ultrassônico viu depois.
 */
export function Comprovacao({ parada }: { parada: Parada }) {
  if (!parada.coletado || !parada.confirmacao) return null
  const origem = CONFIRMACAO[parada.confirmacao]
  const Icone = ICONE_CONFIRMACAO[parada.confirmacao]
  const sensor = parada.confirmacao !== 'SENSOR' ? parada.verificacao_sensor : null
  return (
    <span className="comprovacao">
      <span title={origem.descricao}>
        <Selo tom={parada.confirmacao === 'MANUAL' ? 'cinza' : 'verde'}>
          <Icone size={13} aria-hidden />
          {origem.rotulo}
        </Selo>
      </span>
      {sensor && (
        <Selo tom={VERIFICACAO[sensor].tom}>
          {sensor === 'CONFIRMADA' ? <CheckCircle2 size={13} aria-hidden /> : sensor === 'NAO_DETECTADA' ? <TriangleAlert size={13} aria-hidden /> : null}
          {VERIFICACAO[sensor].rotulo}
        </Selo>
      )}
    </span>
  )
}

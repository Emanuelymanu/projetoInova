import { useEffect, useMemo, useRef, useState } from 'react'
import { dataHora, LIMITE_URGENTE_PCT } from '../lib/formatar'
import type { Leitura } from '../lib/tipos'

const ALTURA = 240
const M = { topo: 16, direita: 52, base: 28, esquerda: 40 }
const COR_LINHA = '#5B8CFF'
const SUPERFICIE = '#13213A'

/**
 * Nível de preenchimento ao longo do tempo. Uma série só (sem legenda, o título nomeia),
 * linha de referência no limite de "cheia", dica com mira ao passar o mouse e tabela.
 */
export function GraficoHistorico({ leituras, horas }: { leituras: Leitura[]; horas: number }) {
  const caixa = useRef<HTMLDivElement>(null)
  const [largura, setLargura] = useState(0)
  const [foco, setFoco] = useState<number | null>(null)

  useEffect(() => {
    if (!caixa.current) return
    const observador = new ResizeObserver(([e]) => setLargura(e.contentRect.width))
    observador.observe(caixa.current)
    return () => observador.disconnect()
  }, [])

  const pontos = useMemo(() => leituras.map((l) => ({ ...l, t: new Date(l.data_hora).getTime() })), [leituras])
  // O período pedido termina na leitura mais recente (o componente só é usado com leituras).
  const fim = pontos.length ? pontos[pontos.length - 1].t : 0
  const inicio = fim - horas * 3_600_000

  const larguraUtil = Math.max(0, largura - M.esquerda - M.direita)
  const alturaUtil = ALTURA - M.topo - M.base
  const x = (t: number) => M.esquerda + ((t - inicio) / (fim - inicio)) * larguraUtil
  const y = (pct: number) => M.topo + (1 - pct / 100) * alturaUtil

  const linha = pontos.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.nivel_preenchimento_pct).toFixed(1)}`).join('')
  const area = pontos.length
    ? `${linha}L${x(pontos[pontos.length - 1].t).toFixed(1)},${y(0)}L${x(pontos[0].t).toFixed(1)},${y(0)}Z`
    : ''

  const marcas = Array.from({ length: 5 }, (_, i) => inicio + ((fim - inicio) * i) / 4)
  const formatarMarca = (t: number) =>
    new Date(t).toLocaleString('pt-BR', horas <= 24 ? { hour: '2-digit', minute: '2-digit' } : { day: '2-digit', month: '2-digit' })

  function aoMover(e: React.PointerEvent<SVGRectElement>) {
    if (!pontos.length) return
    const px = e.clientX - e.currentTarget.getBoundingClientRect().left + M.esquerda
    let maisPerto = 0
    for (let i = 1; i < pontos.length; i++) {
      if (Math.abs(x(pontos[i].t) - px) < Math.abs(x(pontos[maisPerto].t) - px)) maisPerto = i
    }
    setFoco(maisPerto)
  }

  const ultimo = pontos[pontos.length - 1]
  const focado = foco !== null ? pontos[foco] : null

  return (
    <div>
      <div className="grafico" ref={caixa}>
        {largura > 0 && (
          <svg width={largura} height={ALTURA} role="img" aria-label={`Nível de preenchimento nas últimas ${horas} horas`}>
            {[0, 25, 50, 75, 100].map((v) => (
              <g key={v}>
                <line x1={M.esquerda} x2={largura - M.direita} y1={y(v)} y2={y(v)} stroke="#1D2F4F" strokeWidth={1} />
                <text x={M.esquerda - 8} y={y(v)} dy="0.32em" textAnchor="end">
                  {v}%
                </text>
              </g>
            ))}
            {marcas.map((t, i) => (
              <text key={t} x={x(t)} y={ALTURA - 8} textAnchor={i === 0 ? 'start' : i === 4 ? 'end' : 'middle'}>
                {formatarMarca(t)}
              </text>
            ))}

            {/* Referência: a partir daqui a lixeira conta como cheia. */}
            <line x1={M.esquerda} x2={largura - M.direita} y1={y(LIMITE_URGENTE_PCT)} y2={y(LIMITE_URGENTE_PCT)} stroke="#7A2531" strokeWidth={1} />
            <text x={largura - M.direita + 6} y={y(LIMITE_URGENTE_PCT)} dy="0.32em">
              Cheia
            </text>

            {pontos.length > 0 && (
              <>
                <path d={area} fill={COR_LINHA} opacity={0.1} />
                <path d={linha} fill="none" stroke={COR_LINHA} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                <circle cx={x(ultimo.t)} cy={y(ultimo.nivel_preenchimento_pct)} r={4} fill={COR_LINHA} stroke={SUPERFICIE} strokeWidth={2} />
                {!focado && (
                  <text
                    x={x(ultimo.t) + 8}
                    y={y(ultimo.nivel_preenchimento_pct) - 10}
                    style={{ fill: 'var(--texto)', fontWeight: 700, fontSize: 12 }}
                  >
                    {ultimo.nivel_preenchimento_pct}%
                  </text>
                )}
              </>
            )}

            {focado && (
              <g pointerEvents="none">
                <line x1={x(focado.t)} x2={x(focado.t)} y1={M.topo} y2={y(0)} stroke="#2B4370" strokeWidth={1} />
                <circle cx={x(focado.t)} cy={y(focado.nivel_preenchimento_pct)} r={5} fill={COR_LINHA} stroke={SUPERFICIE} strokeWidth={2} />
              </g>
            )}

            {/* Área de captura maior que a linha, para a dica aparecer em qualquer ponto do gráfico. */}
            <rect
              x={M.esquerda}
              y={M.topo}
              width={larguraUtil}
              height={alturaUtil}
              fill="transparent"
              onPointerMove={aoMover}
              onPointerLeave={() => setFoco(null)}
            />
          </svg>
        )}
        {focado && (
          <div className="grafico-dica" style={{ left: x(focado.t), top: y(focado.nivel_preenchimento_pct) }}>
            <strong>{focado.nivel_preenchimento_pct}% cheia</strong>
            <span className="suave">
              {dataHora(focado.data_hora)} · bateria {focado.nivel_bateria_pct}%
            </span>
          </div>
        )}
      </div>

      <details className="tabela-grafico">
        <summary>Ver como tabela ({leituras.length} leituras)</summary>
        <div className="tabela-rolagem">
          <table>
            <thead>
              <tr>
                <th>Data e hora</th>
                <th className="numero">Nível</th>
                <th className="numero">Bateria</th>
                <th className="numero">Distância</th>
              </tr>
            </thead>
            <tbody>
              {/* Duas leituras podem cair no mesmo segundo, então a chave é a posição. */}
              {[...leituras].reverse().map((l, i) => (
                <tr key={i}>
                  <td>{dataHora(l.data_hora)}</td>
                  <td className="numero">{l.nivel_preenchimento_pct}%</td>
                  <td className="numero">{l.nivel_bateria_pct}%</td>
                  <td className="numero">{l.distancia_cm === null ? '–' : `${l.distancia_cm} cm`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}

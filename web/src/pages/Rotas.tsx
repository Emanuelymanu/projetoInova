import { Plus, Route as IconeRota } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Barra, Carregando, MensagemErro, Selo, Vazio } from '../components/ui'
import { dataRota, formatarKm, formatarMinutos, hojeISO, STATUS_ROTA } from '../lib/formatar'
import type { Rota, StatusRota, UsuarioComDesempenho } from '../lib/tipos'
import { useApi } from '../lib/useApi'

const PERIODOS = [
  { id: 'hoje', rotulo: 'Hoje' },
  { id: '7', rotulo: '7 dias' },
  { id: '30', rotulo: '30 dias' },
  { id: 'proximas', rotulo: 'Próximas' },
] as const
type Periodo = (typeof PERIODOS)[number]['id']

function deslocar(dias: number) {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  return d.toLocaleDateString('sv')
}

function filtroDe(periodo: Periodo): string {
  if (periodo === 'hoje') return `data=${hojeISO()}`
  if (periodo === 'proximas') return `de=${deslocar(1)}`
  return `de=${deslocar(-Number(periodo) + 1)}&ate=${hojeISO()}`
}

export function Rotas() {
  const navegar = useNavigate()
  const [periodo, setPeriodo] = useState<Periodo>('hoje')
  const [status, setStatus] = useState<'' | StatusRota>('')
  const [motorista, setMotorista] = useState('')
  const consulta = [filtroDe(periodo), status && `status=${status}`, motorista && `motoristaId=${motorista}`].filter(Boolean).join('&')
  const rotas = useApi<Rota[]>(`/rotas?${consulta}`, 20_000)
  const motoristas = useApi<UsuarioComDesempenho[]>('/usuarios?tipo=MOTORISTA')

  const lista = rotas.dados ?? []

  return (
    <>
      <header className="cabecalho-pagina">
        <div>
          <h1>Rotas</h1>
          <p>Rotas de coleta atribuídas aos motoristas</p>
        </div>
        <Link className="botao" to="/rotas/nova">
          <Plus size={18} aria-hidden /> Nova rota
        </Link>
      </header>

      <div className="filtros">
        <div className="segmentos">
          {PERIODOS.map((p) => (
            <button key={p.id} type="button" aria-pressed={periodo === p.id} onClick={() => setPeriodo(p.id)}>
              {p.rotulo}
            </button>
          ))}
        </div>
        <select className="entrada" value={status} onChange={(e) => setStatus(e.target.value as '' | StatusRota)} aria-label="Situação">
          <option value="">Todas as situações</option>
          {Object.entries(STATUS_ROTA).map(([valor, s]) => (
            <option key={valor} value={valor}>
              {s.rotulo}
            </option>
          ))}
        </select>
        <select className="entrada" value={motorista} onChange={(e) => setMotorista(e.target.value)} aria-label="Motorista">
          <option value="">Todos os motoristas</option>
          {(motoristas.dados ?? []).map((m) => (
            <option key={m.id} value={m.id}>
              {m.nome}
            </option>
          ))}
        </select>
      </div>

      {rotas.erro && <MensagemErro>{rotas.erro}</MensagemErro>}

      <section className="cartao">
        {rotas.carregando && !rotas.dados ? (
          <Carregando />
        ) : lista.length === 0 ? (
          <Vazio icone={<IconeRota size={32} aria-hidden />}>
            Nenhuma rota neste período. <Link to="/rotas/nova">Montar uma rota</Link>
          </Vazio>
        ) : (
          <div className="tabela-rolagem">
            <table>
              <thead>
                <tr>
                  <th>Rota</th>
                  <th>Data</th>
                  <th>Motorista</th>
                  <th>Situação</th>
                  <th style={{ minWidth: 180 }}>Coletas</th>
                  <th className="numero">Distância</th>
                  <th className="numero">Tempo est.</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((r) => {
                  const naoColetadas = r.status === 'CONCLUIDA' ? r.total_paradas - r.coletadas : 0
                  return (
                    <tr key={r.id} className="clicavel" onClick={() => navegar(`/rotas/${r.id}`)}>
                      <td className="celula-principal">
                        {r.nome}
                        <small>#{r.id}</small>
                      </td>
                      <td>{dataRota(r.data_rota)}</td>
                      <td>{r.motorista?.nome ?? <span className="fraco">Sem motorista</span>}</td>
                      <td>
                        <Selo tom={STATUS_ROTA[r.status].tom} ponto>
                          {STATUS_ROTA[r.status].rotulo}
                        </Selo>
                      </td>
                      <td>
                        <div className="nivel">
                          <Barra pct={r.total_paradas ? (r.coletadas / r.total_paradas) * 100 : 0} cor="var(--verde)" />
                          <span className="nivel-valor" style={{ width: 54 }}>
                            {r.coletadas}/{r.total_paradas}
                          </span>
                        </div>
                        {naoColetadas > 0 && (
                          <small className="alerta-texto">
                            {naoColetadas} {naoColetadas === 1 ? 'ponto não coletado' : 'pontos não coletados'}
                          </small>
                        )}
                      </td>
                      <td className="numero">{formatarKm(r.distancia_total_km)}</td>
                      <td className="numero">{formatarMinutos(r.tempo_estimado_min)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}

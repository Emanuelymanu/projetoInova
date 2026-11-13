import { ArrowLeft, Check, CheckCircle2, Clock, MapPin, ShieldCheck, Truck, XCircle } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { LegendaMapa, Mapa } from '../components/Mapa'
import { Barra, Carregando, Comprovacao, Indicador, MensagemErro, Nivel, Selo } from '../components/ui'
import { api } from '../lib/api'
import { dataHora, dataRota, formatarKm, formatarMinutos, hora, STATUS_ROTA } from '../lib/formatar'
import type { Rota } from '../lib/tipos'
import { useApi } from '../lib/useApi'

export function RotaDetalhe() {
  const { id } = useParams()
  // Atualiza a cada 15 s para acompanhar o motorista ao vivo.
  const rota = useApi<Rota>(`/rotas/${id}`, 15_000)
  const [erroAcao, setErroAcao] = useState<string | null>(null)

  if (rota.carregando && !rota.dados) return <Carregando />
  if (!rota.dados) return <MensagemErro>{rota.erro}</MensagemErro>
  const r = rota.dados
  const aberta = r.status === 'PLANEJADA' || r.status === 'EM_ANDAMENTO'
  const pct = r.total_paradas ? Math.round((r.coletadas / r.total_paradas) * 100) : 0
  const paradas = r.paradas.filter((p) => p.lixeira)

  async function executar(acao: 'cancelar' | 'finalizar') {
    const pergunta =
      acao === 'cancelar'
        ? 'Cancelar esta rota? Ela some do app do motorista.'
        : 'Encerrar esta rota agora? Os pontos não coletados ficam registrados.'
    if (!confirm(pergunta)) return
    setErroAcao(null)
    try {
      await api(`/rotas/${r.id}/${acao}`, { metodo: 'POST' })
      rota.recarregar()
    } catch (e) {
      setErroAcao(e instanceof Error ? e.message : 'Não foi possível concluir a ação.')
    }
  }

  return (
    <>
      <Link to="/rotas" className="voltar">
        <ArrowLeft size={16} aria-hidden /> Rotas
      </Link>
      <header className="cabecalho-pagina">
        <div>
          <h1>{r.nome}</h1>
          <p>
            {dataRota(r.data_rota, true)} · {r.motorista?.nome ?? 'Sem motorista'} · #{r.id}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <Selo tom={STATUS_ROTA[r.status].tom} ponto>
            {STATUS_ROTA[r.status].rotulo}
          </Selo>
          {aberta && (
            <>
              <button type="button" className="botao secundario" onClick={() => executar('finalizar')}>
                <Check size={16} aria-hidden /> Encerrar
              </button>
              <button type="button" className="botao perigo" onClick={() => executar('cancelar')}>
                <XCircle size={16} aria-hidden /> Cancelar rota
              </button>
            </>
          )}
        </div>
      </header>

      {(erroAcao || rota.erro) && (
        <div style={{ marginBottom: 16 }}>
          <MensagemErro>{erroAcao ?? rota.erro}</MensagemErro>
        </div>
      )}

      <section className="grade-indicadores">
        <Indicador
          icone={<CheckCircle2 size={16} aria-hidden />}
          rotulo="Coletados"
          valor={`${r.coletadas}/${r.total_paradas}`}
          detalhe={<Barra pct={pct} cor="var(--verde)" />}
        />
        <Indicador
          icone={<ShieldCheck size={16} aria-hidden />}
          rotulo="Coletas comprovadas"
          valor={`${r.comprovadas}/${r.coletadas}`}
          detalhe="Pela tag RFID ou pelo sensor"
        />
        <Indicador icone={<MapPin size={16} aria-hidden />} rotulo="Distância estimada" valor={formatarKm(r.distancia_total_km)} />
        <Indicador icone={<Clock size={16} aria-hidden />} rotulo="Tempo estimado" valor={formatarMinutos(r.tempo_estimado_min)} />
        <Indicador
          icone={<Truck size={16} aria-hidden />}
          rotulo="Andamento"
          valor={<span style={{ fontSize: 20 }}>{r.iniciada_em ? `Início ${hora(r.iniciada_em)}` : 'Não iniciada'}</span>}
          detalhe={r.concluida_em ? `Encerrada às ${hora(r.concluida_em)}` : aberta ? 'Atualiza a cada 15 segundos' : undefined}
        />
      </section>

      <div className="duas-colunas">
        <section className="cartao">
          <div className="cartao-titulo">
            <h2>Pontos na ordem de visita</h2>
          </div>
          <div className="tabela-rolagem">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Lixeira</th>
                  <th>Nível atual</th>
                  <th>Coleta</th>
                </tr>
              </thead>
              <tbody>
                {paradas.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className={`ordem-bola${p.coletado ? ' feita' : ''}`}>{p.coletado ? <Check size={14} aria-label="Coletada" /> : p.ordem_visita}</span>
                    </td>
                    <td className="celula-principal">
                      <Link to={`/lixeiras/${p.lixeira!.id}`}>{p.lixeira!.codigo_identificador}</Link>
                      <small>{p.lixeira!.endereco ?? p.lixeira!.zona?.nome ?? 'Sem endereço'}</small>
                    </td>
                    <td>
                      <Nivel pct={p.lixeira!.nivel_preenchimento_pct} />
                    </td>
                    <td>
                      {p.coletado ? (
                        <div style={{ display: 'grid', gap: 6 }}>
                          <span className="suave">{p.data_hora_coleta ? dataHora(p.data_hora_coleta) : 'Coletada'}</span>
                          <Comprovacao parada={p} />
                        </div>
                      ) : r.status === 'CONCLUIDA' ? (
                        <Selo tom="amarelo">Não coletada</Selo>
                      ) : (
                        <span className="fraco">Pendente</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="cartao">
          <div className="cartao-titulo">
            <h2>Mapa da rota</h2>
          </div>
          <Mapa ligar pontos={paradas.map((p) => ({ lixeira: p.lixeira!, ordem: p.ordem_visita, apagado: p.coletado }))} />
          <LegendaMapa comColetada />
        </section>
      </div>
    </>
  )
}

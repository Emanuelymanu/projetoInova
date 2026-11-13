import { ArrowLeft, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LegendaMapa, Mapa } from '../components/Mapa'
import { Carregando, MensagemErro, Nivel, SeloPrioridade, Vazio } from '../components/ui'
import { api } from '../lib/api'
import {
  distanciaTotal,
  formatarKm,
  formatarMinutos,
  hojeISO,
  LIMITE_ATENCAO_PCT,
  ordenarPorProximidade,
} from '../lib/formatar'
import type { Lixeira, Rota, UsuarioComDesempenho, Zona } from '../lib/tipos'
import { useApi } from '../lib/useApi'

// Mesma estimativa do backend (VELOCIDADE_MEDIA_KMH e MINUTOS_POR_PARADA).
const VELOCIDADE_KMH = 20
const MINUTOS_POR_PARADA = 4

/**
 * O sistema sugere as lixeiras com 50% ou mais que ainda não estão em uma rota aberta
 * na data escolhida; o gestor ajusta a seleção e escolhe o motorista.
 */
export function NovaRota() {
  const navegar = useNavigate()
  const [data, setData] = useState(hojeISO())
  const [motoristaId, setMotoristaId] = useState('')
  const [zona, setZona] = useState('')
  const [selecao, setSelecao] = useState<Set<number> | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const lixeiras = useApi<Lixeira[]>('/lixeiras')
  const motoristas = useApi<UsuarioComDesempenho[]>('/usuarios?tipo=MOTORISTA')
  const zonas = useApi<Zona[]>('/zonas')
  const rotasDoDia = useApi<Rota[]>(`/rotas?data=${data}`)

  // Lixeiras que já estão em uma rota aberta nesse dia (e ainda não foram coletadas).
  const jaEmRota = useMemo(() => {
    const ids = new Map<number, string>()
    for (const r of rotasDoDia.dados ?? []) {
      if (r.status !== 'PLANEJADA' && r.status !== 'EM_ANDAMENTO') continue
      for (const p of r.paradas) if (p.lixeira && !p.coletado) ids.set(p.lixeira.id, r.motorista?.nome ?? r.nome)
    }
    return ids
  }, [rotasDoDia.dados])

  const disponiveis = useMemo(
    () =>
      (lixeiras.dados ?? [])
        .filter((l) => l.status !== 'DESATIVADO')
        .sort((a, b) => b.nivel_preenchimento_pct - a.nivel_preenchimento_pct),
    [lixeiras.dados],
  )

  const sugestao = useMemo(
    () =>
      new Set(
        disponiveis
          .filter((l) => l.status === 'OPERACIONAL' && l.nivel_preenchimento_pct >= LIMITE_ATENCAO_PCT && !jaEmRota.has(l.id))
          .filter((l) => !zona || String(l.zona?.id) === zona)
          .map((l) => l.id),
      ),
    [disponiveis, jaEmRota, zona],
  )

  // Até o gestor mexer na seleção, ela acompanha a sugestão (que muda com a data e o local).
  const selecionadas = selecao ?? sugestao
  const visiveis = disponiveis.filter((l) => !zona || String(l.zona?.id) === zona || selecionadas.has(l.id))
  const ordenadas = ordenarPorProximidade(disponiveis.filter((l) => selecionadas.has(l.id)))
  const distancia = distanciaTotal(ordenadas)
  const tempo = Math.round((distancia / VELOCIDADE_KMH) * 60 + ordenadas.length * MINUTOS_POR_PARADA)
  const motoristasAtivos = (motoristas.dados ?? []).filter((m) => m.ativo)

  function alternar(id: number) {
    const nova = new Set(selecionadas)
    if (nova.has(id)) nova.delete(id)
    else nova.add(id)
    setSelecao(nova)
  }

  async function criar() {
    if (!motoristaId) {
      setErro('Escolha o motorista.')
      return
    }
    setEnviando(true)
    setErro(null)
    try {
      const rota = await api<Rota>('/rotas', {
        metodo: 'POST',
        corpo: { motorista_id: Number(motoristaId), data_rota: data, lixeira_ids: ordenadas.map((l) => l.id) },
      })
      navegar(`/rotas/${rota.id}`)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível criar a rota.')
      setEnviando(false)
    }
  }

  if (lixeiras.carregando && !lixeiras.dados) return <Carregando />

  return (
    <>
      <Link to="/rotas" className="voltar">
        <ArrowLeft size={16} aria-hidden /> Rotas
      </Link>
      <header className="cabecalho-pagina">
        <div>
          <h1>Nova rota</h1>
          <p>Escolha o motorista e confira os pontos sugeridos</p>
        </div>
      </header>

      {lixeiras.erro && <MensagemErro>{lixeiras.erro}</MensagemErro>}

      <div className="duas-colunas">
        <div className="pilha">
          <section className="cartao">
            <div className="formulario">
              <div className="linha">
                <label className="rotulo">
                  Motorista
                  <select className="entrada" value={motoristaId} onChange={(e) => setMotoristaId(e.target.value)}>
                    <option value="">Escolha…</option>
                    {motoristasAtivos.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nome}
                        {m.rota_hoje && data === hojeISO() ? ' (já tem rota hoje)' : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="rotulo">
                  Data
                  <input
                    className="entrada"
                    type="date"
                    min={hojeISO()}
                    value={data}
                    onChange={(e) => {
                      setData(e.target.value || hojeISO())
                      setSelecao(null)
                    }}
                  />
                </label>
              </div>
              <label className="rotulo">
                Local
                <select
                  className="entrada"
                  value={zona}
                  onChange={(e) => {
                    setZona(e.target.value)
                    setSelecao(null)
                  }}
                >
                  <option value="">Todos os locais</option>
                  {(zonas.dados ?? []).map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.nome}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="cartao">
            <div className="cartao-titulo">
              <div>
                <h2>Pontos de coleta</h2>
                <p>
                  {selecionadas.size} selecionados · sugerimos os com {LIMITE_ATENCAO_PCT}% ou mais
                </p>
              </div>
              {selecao && (
                <button type="button" className="botao secundario pequeno" onClick={() => setSelecao(null)}>
                  <Sparkles size={14} aria-hidden /> Usar sugestão
                </button>
              )}
            </div>
            {visiveis.length === 0 ? (
              <Vazio icone={<Sparkles size={28} aria-hidden />}>Nenhuma lixeira neste local.</Vazio>
            ) : (
              <div className="lista-selecao">
                {visiveis.map((l) => {
                  const marcada = selecionadas.has(l.id)
                  const outraRota = jaEmRota.get(l.id)
                  return (
                    <label key={l.id} className={`selecao-lixeira${marcada ? ' marcada' : ''}`}>
                      <input type="checkbox" checked={marcada} onChange={() => alternar(l.id)} />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <strong>{l.codigo_identificador}</strong>
                        <span className="suave"> · {l.zona?.nome ?? 'Sem zona'}</span>
                        <small className="suave" style={{ display: 'block' }}>
                          {l.endereco ?? 'Sem endereço'}
                        </small>
                        {outraRota && <small className="alerta-texto">Já está na rota de {outraRota}</small>}
                        {l.status === 'MANUTENCAO' && <small className="alerta-texto"> Em manutenção</small>}
                      </span>
                      <span style={{ width: 150 }}>
                        <Nivel pct={l.nivel_preenchimento_pct} />
                      </span>
                      <SeloPrioridade nivel={l.nivel_preenchimento_pct} />
                    </label>
                  )
                })}
              </div>
            )}
          </section>
        </div>

        <div className="pilha">
          <section className="cartao">
            <div className="cartao-titulo">
              <div>
                <h2>Ordem de visita</h2>
                <p>Começa pela mais cheia e segue sempre para a mais próxima</p>
              </div>
            </div>
            {ordenadas.length > 0 ? (
              <>
                <Mapa ligar pontos={ordenadas.map((lixeira, i) => ({ lixeira, ordem: i + 1 }))} />
                <LegendaMapa />
              </>
            ) : (
              <Vazio icone={<Sparkles size={28} aria-hidden />}>Selecione pelo menos uma lixeira.</Vazio>
            )}
            <dl className="dados-lista" style={{ marginTop: 16 }}>
              <dt>Pontos</dt>
              <dd>{ordenadas.length}</dd>
              <dt>Distância estimada</dt>
              <dd>{formatarKm(distancia)}</dd>
              <dt>Tempo estimado</dt>
              <dd>{formatarMinutos(tempo)}</dd>
            </dl>
          </section>

          {erro && <MensagemErro>{erro}</MensagemErro>}
          <button type="button" className="botao" style={{ height: 48 }} disabled={enviando || ordenadas.length === 0} onClick={criar}>
            Criar rota com {ordenadas.length} {ordenadas.length === 1 ? 'ponto' : 'pontos'}
          </button>
        </div>
      </div>
    </>
  )
}

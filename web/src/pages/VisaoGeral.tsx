import { BatteryLow, CheckCircle2, Plus, Route as IconeRota, ShieldAlert, WifiOff, Trash2, TriangleAlert, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LegendaMapa, Mapa } from '../components/Mapa'
import { Barra, Carregando, Indicador, MensagemErro, Selo, SeloPrioridade, Vazio } from '../components/ui'
import { dataRota, hojeISO, hora, LIMITE_ATENCAO_PCT, LIMITE_BATERIA_BAIXA_PCT, LIMITE_URGENTE_PCT, STATUS_ROTA, tempoDesde } from '../lib/formatar'
import type { Dashboard, Lixeira, Parada, Rota } from '../lib/tipos'
import { useApi } from '../lib/useApi'

const ATUALIZAR_MS = 30_000

export function VisaoGeral() {
  const hoje = hojeISO()
  const painel = useApi<Dashboard>('/dashboard', ATUALIZAR_MS)
  const rotas = useApi<Rota[]>(`/rotas?data=${hoje}`, ATUALIZAR_MS)

  if (painel.carregando && !painel.dados) return <Carregando />
  if (!painel.dados) return <MensagemErro>{painel.erro}</MensagemErro>

  const { resumo, lixeiras } = painel.dados
  const rotasHoje = (rotas.dados ?? []).filter((r) => r.status !== 'CANCELADA')
  const totalParadas = rotasHoje.reduce((s, r) => s + r.total_paradas, 0)
  const coletadas = rotasHoje.reduce((s, r) => s + r.coletadas, 0)
  const emAndamento = rotasHoje.filter((r) => r.status === 'EM_ANDAMENTO').length

  // Lixeiras que estão em alguma rota aberta hoje já têm coleta prevista.
  const naRota = new Set(
    rotasHoje.filter((r) => r.status !== 'CONCLUIDA').flatMap((r) => r.paradas.filter((p) => !p.coletado).map((p) => p.lixeira?.id)),
  )
  const cheiasSemRota = lixeiras.filter((l) => l.nivel_preenchimento_pct >= LIMITE_URGENTE_PCT && !naRota.has(l.id))
  // Coletas marcadas hoje em que o sensor leu depois e o nível não caiu: vale conferir.
  const suspeitas = rotasHoje.flatMap((r) =>
    r.paradas.filter((p) => p.verificacao_sensor === 'NAO_DETECTADA').map((parada) => ({ parada, rota: r })),
  )
  const atencao = lixeiras.filter((l) => l.nivel_preenchimento_pct >= LIMITE_ATENCAO_PCT && l.nivel_preenchimento_pct < LIMITE_URGENTE_PCT).length

  return (
    <>
      <header className="cabecalho-pagina">
        <div>
          <h1>Visão geral</h1>
          <p>
            {dataRota(hoje, true)} · atualizado às {painel.atualizadoEm ? hora(painel.atualizadoEm) : '–'}
          </p>
        </div>
        <Link className="botao" to="/rotas/nova">
          <Plus size={18} aria-hidden /> Montar rota
        </Link>
      </header>

      {painel.erro && (
        <div style={{ marginBottom: 16 }}>
          <MensagemErro>Não foi possível atualizar: {painel.erro}. Mostrando os últimos dados.</MensagemErro>
        </div>
      )}

      <section className="grade-indicadores" aria-label="Indicadores">
        <Indicador
          destaque={resumo.cheias > 0}
          icone={<TriangleAlert size={16} color="var(--vermelho-texto)" aria-hidden />}
          rotulo="Cheias (80% ou mais)"
          valor={resumo.cheias}
          detalhe={cheiasSemRota.length ? `${cheiasSemRota.length} sem rota prevista` : 'Todas com coleta prevista'}
        />
        <Indicador icone={<Trash2 size={16} aria-hidden />} rotulo="Em atenção (50–79%)" valor={atencao} detalhe={`de ${resumo.total} monitoradas`} />
        <Indicador
          icone={<Truck size={16} aria-hidden />}
          rotulo="Rotas de hoje"
          valor={rotasHoje.length}
          detalhe={`${emAndamento} em andamento`}
        />
        <Indicador
          icone={<CheckCircle2 size={16} aria-hidden />}
          rotulo="Pontos coletados hoje"
          valor={totalParadas ? `${coletadas}/${totalParadas}` : '0'}
          detalhe={totalParadas ? `${Math.round((coletadas / totalParadas) * 100)}% concluído` : 'Nenhuma rota hoje'}
        />
        <Indicador
          icone={<WifiOff size={16} aria-hidden />}
          rotulo="Sensores sem sinal"
          valor={resumo.sem_sinal}
          detalhe={`${resumo.bateria_baixa} com bateria baixa`}
        />
      </section>

      <div className="duas-colunas">
        <section className="cartao">
          <div className="cartao-titulo">
            <div>
              <h2>Mapa das lixeiras</h2>
              <p>Cor pelo nível de preenchimento. Clique em um ponto para ver os detalhes.</p>
            </div>
          </div>
          <Mapa pontos={lixeiras.map((lixeira) => ({ lixeira }))} />
          <LegendaMapa />
        </section>

        <section className="cartao">
          <div className="cartao-titulo">
            <h2>Alertas</h2>
            <span className="suave">{contarAlertas(lixeiras, cheiasSemRota, suspeitas.length)}</span>
          </div>
          <ListaAlertas lixeiras={lixeiras} cheiasSemRota={cheiasSemRota} suspeitas={suspeitas} />
        </section>
      </div>

      <section className="cartao">
        <div className="cartao-titulo">
          <div>
            <h2>Rotas de hoje</h2>
            <p>Progresso de cada motorista, atualizado a cada 30 segundos</p>
          </div>
          <Link to="/rotas" className="botao secundario pequeno">
            Ver todas
          </Link>
        </div>
        {rotas.erro && !rotas.dados && <MensagemErro>{rotas.erro}</MensagemErro>}
        {rotasHoje.length === 0 ? (
          <Vazio icone={<IconeRota size={32} aria-hidden />}>
            Nenhuma rota para hoje. <Link to="/rotas/nova">Montar uma rota</Link>
          </Vazio>
        ) : (
          <div className="tabela-rolagem">
            <table>
              <thead>
                <tr>
                  <th>Rota</th>
                  <th>Motorista</th>
                  <th>Situação</th>
                  <th style={{ minWidth: 200 }}>Progresso</th>
                </tr>
              </thead>
              <tbody>
                {rotasHoje.map((r) => (
                  <tr key={r.id}>
                    <td className="celula-principal">
                      <Link to={`/rotas/${r.id}`}>{r.nome}</Link>
                      <small>{r.total_paradas} pontos</small>
                    </td>
                    <td>{r.motorista?.nome ?? '–'}</td>
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}

function contarAlertas(lixeiras: Lixeira[], cheiasSemRota: Lixeira[], suspeitas: number) {
  const n = suspeitas + cheiasSemRota.length + lixeiras.filter((l) => l.sem_sinal || l.nivel_bateria_pct < LIMITE_BATERIA_BAIXA_PCT).length
  return n === 0 ? 'Nenhum' : `${n} ${n === 1 ? 'alerta' : 'alertas'}`
}

function ListaAlertas({
  lixeiras,
  cheiasSemRota,
  suspeitas,
}: {
  lixeiras: Lixeira[]
  cheiasSemRota: Lixeira[]
  suspeitas: { parada: Parada; rota: Rota }[]
}) {
  const semSinal = lixeiras.filter((l) => l.sem_sinal)
  const bateria = lixeiras.filter((l) => !l.sem_sinal && l.nivel_bateria_pct < LIMITE_BATERIA_BAIXA_PCT)

  if (!suspeitas.length && !cheiasSemRota.length && !semSinal.length && !bateria.length) {
    return (
      <Vazio icone={<CheckCircle2 size={32} aria-hidden />}>
        Tudo em ordem. Nenhuma lixeira cheia fora de rota e todos os sensores respondendo.
      </Vazio>
    )
  }

  return (
    <div className="lista">
      {suspeitas.map(({ parada, rota }) => (
        <Link key={`q${parada.id}`} to={`/rotas/${rota.id}`} className="lista-item">
          <span className="icone-alerta tom-amarelo">
            <ShieldAlert size={17} aria-hidden />
          </span>
          <span className="conteudo">
            <strong>{parada.lixeira?.codigo_identificador}</strong> coletada sem queda de nível
            <small>
              Marcada por {rota.motorista?.nome ?? 'motorista'}, mas o sensor ainda mostra {parada.lixeira?.nivel_preenchimento_pct}%
            </small>
          </span>
        </Link>
      ))}
      {cheiasSemRota.length > 0 && (
        <div className="mensagem info" style={{ marginBottom: 8, justifyContent: 'space-between' }}>
          <span>
            {cheiasSemRota.length} {cheiasSemRota.length === 1 ? 'lixeira cheia' : 'lixeiras cheias'} sem rota prevista
          </span>
          <Link to="/rotas/nova" className="botao pequeno">
            Montar rota
          </Link>
        </div>
      )}
      {cheiasSemRota.map((l) => (
        <Link key={`c${l.id}`} to={`/lixeiras/${l.id}`} className="lista-item">
          <span className="icone-alerta tom-vermelho">
            <TriangleAlert size={17} aria-hidden />
          </span>
          <span className="conteudo">
            <strong>{l.codigo_identificador}</strong> · {l.nivel_preenchimento_pct}%
            <small>{l.endereco ?? l.zona?.nome ?? 'Sem endereço'}</small>
          </span>
          <SeloPrioridade nivel={l.nivel_preenchimento_pct} />
        </Link>
      ))}
      {semSinal.map((l) => (
        <Link key={`s${l.id}`} to={`/lixeiras/${l.id}`} className="lista-item">
          <span className="icone-alerta tom-amarelo">
            <WifiOff size={17} aria-hidden />
          </span>
          <span className="conteudo">
            <strong>{l.codigo_identificador}</strong> sem sinal
            <small>Última leitura {tempoDesde(l.ultima_atualizacao)}</small>
          </span>
        </Link>
      ))}
      {bateria.map((l) => (
        <Link key={`b${l.id}`} to={`/lixeiras/${l.id}`} className="lista-item">
          <span className="icone-alerta tom-amarelo">
            <BatteryLow size={17} aria-hidden />
          </span>
          <span className="conteudo">
            <strong>{l.codigo_identificador}</strong> com bateria baixa
            <small>Bateria do sensor em {l.nivel_bateria_pct}%</small>
          </span>
        </Link>
      ))}
    </div>
  )
}

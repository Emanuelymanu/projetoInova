import { ArrowLeft, BatteryMedium, Clock, Pencil, Ruler, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FormLixeira } from '../components/FormLixeira'
import { GraficoHistorico } from '../components/GraficoHistorico'
import { Mapa } from '../components/Mapa'
import { Carregando, Indicador, MensagemErro, Selo, SeloPrioridade, Vazio } from '../components/ui'
import { dataHora, STATUS_LIXEIRA, tempoDesde } from '../lib/formatar'
import type { Leitura, Lixeira, Zona } from '../lib/tipos'
import { useApi } from '../lib/useApi'

const PERIODOS = [
  { horas: 24, rotulo: '24 horas' },
  { horas: 168, rotulo: '7 dias' },
  { horas: 720, rotulo: '30 dias' },
]

export function LixeiraDetalhe() {
  const { id } = useParams()
  const [horas, setHoras] = useState(24)
  const [editando, setEditando] = useState(false)
  const lixeira = useApi<Lixeira>(`/lixeiras/${id}`, 30_000)
  const historico = useApi<Leitura[]>(`/lixeiras/${id}/historico?horas=${horas}`, 60_000)
  const zonas = useApi<Zona[]>('/zonas')

  if (lixeira.carregando && !lixeira.dados) return <Carregando />
  if (!lixeira.dados) return <MensagemErro>{lixeira.erro}</MensagemErro>
  const l = lixeira.dados

  return (
    <>
      <Link to="/lixeiras" className="voltar">
        <ArrowLeft size={16} aria-hidden /> Lixeiras
      </Link>
      <header className="cabecalho-pagina">
        <div>
          <h1>{l.codigo_identificador}</h1>
          <p>
            {l.endereco ?? 'Sem endereço'} · {l.zona?.nome ?? 'Sem zona'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <SeloPrioridade nivel={l.nivel_preenchimento_pct} />
          <Selo tom={STATUS_LIXEIRA[l.status].tom}>{STATUS_LIXEIRA[l.status].rotulo}</Selo>
          <button type="button" className="botao secundario" onClick={() => setEditando(true)}>
            <Pencil size={16} aria-hidden /> Editar
          </button>
        </div>
      </header>

      <section className="grade-indicadores">
        <Indicador icone={<Trash2 size={16} aria-hidden />} rotulo="Nível agora" valor={`${l.nivel_preenchimento_pct}%`} detalhe={`${Math.round((l.capacidade_litros * l.nivel_preenchimento_pct) / 100)} de ${l.capacidade_litros} litros`} />
        <Indicador icone={<BatteryMedium size={16} aria-hidden />} rotulo="Bateria do sensor" valor={`${l.nivel_bateria_pct}%`} />
        <Indicador
          icone={<Clock size={16} aria-hidden />}
          rotulo="Última leitura"
          valor={<span style={{ fontSize: 22 }}>{tempoDesde(l.ultima_atualizacao)}</span>}
          detalhe={l.sem_sinal ? <span className="alerta-texto">Sem sinal: o nível pode estar desatualizado</span> : dataHora(l.ultima_atualizacao)}
        />
        <Indicador icone={<Ruler size={16} aria-hidden />} rotulo="Altura interna" valor={`${l.altura_cm} cm`} detalhe="Da tampa até o fundo" />
      </section>

      <div className="duas-colunas">
        <section className="cartao">
          <div className="cartao-titulo">
            <div>
              <h2>Nível de preenchimento</h2>
              <p>Cada ponto é uma leitura do sensor</p>
            </div>
            <div className="segmentos">
              {PERIODOS.map((p) => (
                <button key={p.horas} type="button" aria-pressed={horas === p.horas} onClick={() => setHoras(p.horas)}>
                  {p.rotulo}
                </button>
              ))}
            </div>
          </div>
          {historico.carregando && !historico.dados ? (
            <Carregando />
          ) : historico.erro && !historico.dados ? (
            <MensagemErro>{historico.erro}</MensagemErro>
          ) : (historico.dados ?? []).length === 0 ? (
            <Vazio icone={<Clock size={32} aria-hidden />}>Nenhuma leitura neste período.</Vazio>
          ) : (
            <GraficoHistorico leituras={historico.dados ?? []} horas={horas} />
          )}
        </section>

        <section className="cartao">
          <div className="cartao-titulo">
            <h2>Localização</h2>
          </div>
          <Mapa pontos={[{ lixeira: l }]} />
          <dl className="dados-lista" style={{ marginTop: 14 }}>
            <dt>Coordenadas</dt>
            <dd>
              {l.latitude.toFixed(5)}, {l.longitude.toFixed(5)}
            </dd>
            <dt>Capacidade</dt>
            <dd>{l.capacidade_litros} litros</dd>
            <dt>Tag RFID</dt>
            <dd style={{ wordBreak: 'break-all' }}>{l.epc ?? <span className="alerta-texto">Não cadastrada</span>}</dd>
            <dt>Último esvaziamento</dt>
            <dd>{l.ultimo_esvaziamento ? dataHora(l.ultimo_esvaziamento) : <span className="fraco">Ainda não detectado</span>}</dd>
          </dl>
        </section>
      </div>

      {editando && (
        <FormLixeira
          lixeira={l}
          zonas={zonas.dados ?? []}
          aoFechar={() => setEditando(false)}
          aoSalvar={() => {
            setEditando(false)
            lixeira.recarregar()
          }}
        />
      )}
    </>
  )
}

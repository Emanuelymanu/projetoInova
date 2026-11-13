import { BatteryLow, Map as IconeMapa, Plus, Search, WifiOff, Table, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FormLixeira } from '../components/FormLixeira'
import { LegendaMapa, Mapa } from '../components/Mapa'
import { Carregando, MensagemErro, Nivel, Selo, SeloPrioridade, Vazio } from '../components/ui'
import { LIMITE_BATERIA_BAIXA_PCT, prioridadeDe, STATUS_LIXEIRA, tempoDesde, type Prioridade } from '../lib/formatar'
import type { Lixeira, Zona } from '../lib/tipos'
import { useApi } from '../lib/useApi'

export function Lixeiras() {
  const navegar = useNavigate()
  const lixeiras = useApi<Lixeira[]>('/lixeiras', 30_000)
  const zonas = useApi<Zona[]>('/zonas')
  const [busca, setBusca] = useState('')
  const [parametros] = useSearchParams()
  const [zona, setZona] = useState(parametros.get('zona') ?? '')
  const [prioridade, setPrioridade] = useState<'' | Prioridade>('')
  const [status, setStatus] = useState('')
  const [visao, setVisao] = useState<'tabela' | 'mapa'>('tabela')
  const [cadastrando, setCadastrando] = useState(false)

  const termo = busca.trim().toLowerCase()
  const filtradas = (lixeiras.dados ?? []).filter(
    (l) =>
      (!termo || `${l.codigo_identificador} ${l.endereco ?? ''}`.toLowerCase().includes(termo)) &&
      (!zona || String(l.zona?.id ?? 'sem') === zona) &&
      (!prioridade || prioridadeDe(l.nivel_preenchimento_pct) === prioridade) &&
      (!status || l.status === status),
  )

  return (
    <>
      <header className="cabecalho-pagina">
        <div>
          <h1>Lixeiras</h1>
          <p>{lixeiras.dados ? `${lixeiras.dados.length} lixeiras cadastradas` : 'Carregando…'}</p>
        </div>
        <button type="button" className="botao" onClick={() => setCadastrando(true)}>
          <Plus size={18} aria-hidden /> Nova lixeira
        </button>
      </header>

      <div className="filtros">
        <div className="campo-busca">
          <Search size={16} aria-hidden />
          <input className="entrada" placeholder="Buscar por código ou endereço" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar" />
        </div>
        <select className="entrada" value={zona} onChange={(e) => setZona(e.target.value)} aria-label="Local">
          <option value="">Todos os locais</option>
          {(zonas.dados ?? []).map((z) => (
            <option key={z.id} value={z.id}>
              {z.nome}
            </option>
          ))}
          <option value="sem">Sem zona</option>
        </select>
        <select className="entrada" value={prioridade} onChange={(e) => setPrioridade(e.target.value as '' | Prioridade)} aria-label="Nível">
          <option value="">Todos os níveis</option>
          <option value="alta">Urgente (80% ou mais)</option>
          <option value="media">Atenção (50–79%)</option>
          <option value="baixa">OK (abaixo de 50%)</option>
        </select>
        <select className="entrada" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Situação do equipamento">
          <option value="">Qualquer situação</option>
          <option value="OPERACIONAL">Operacional</option>
          <option value="MANUTENCAO">Em manutenção</option>
          <option value="DESATIVADO">Desativada</option>
        </select>
        <div className="segmentos" style={{ marginLeft: 'auto' }}>
          <button type="button" aria-pressed={visao === 'tabela'} onClick={() => setVisao('tabela')}>
            <Table size={15} aria-hidden /> Tabela
          </button>
          <button type="button" aria-pressed={visao === 'mapa'} onClick={() => setVisao('mapa')}>
            <IconeMapa size={15} aria-hidden /> Mapa
          </button>
        </div>
      </div>

      {lixeiras.erro && <MensagemErro>{lixeiras.erro}</MensagemErro>}

      <section className="cartao">
        {lixeiras.carregando && !lixeiras.dados ? (
          <Carregando />
        ) : filtradas.length === 0 ? (
          <Vazio icone={<Trash2 size={32} aria-hidden />}>Nenhuma lixeira com esses filtros.</Vazio>
        ) : visao === 'mapa' ? (
          <>
            <Mapa alto pontos={filtradas.map((lixeira) => ({ lixeira }))} />
            <LegendaMapa />
          </>
        ) : (
          <div className="tabela-rolagem">
            <table>
              <thead>
                <tr>
                  <th>Lixeira</th>
                  <th>Local</th>
                  <th>Nível</th>
                  <th>Prioridade</th>
                  <th className="numero">Bateria</th>
                  <th>Última leitura</th>
                  <th>Equipamento</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((l) => (
                  <tr key={l.id} className="clicavel" onClick={() => navegar(`/lixeiras/${l.id}`)}>
                    <td className="celula-principal">
                      {l.codigo_identificador}
                      <small>{l.endereco ?? 'Sem endereço'}</small>
                    </td>
                    <td>{l.zona?.nome ?? <span className="fraco">Sem zona</span>}</td>
                    <td>
                      <Nivel pct={l.nivel_preenchimento_pct} />
                    </td>
                    <td>
                      <SeloPrioridade nivel={l.nivel_preenchimento_pct} />
                    </td>
                    <td className={`numero${l.nivel_bateria_pct < LIMITE_BATERIA_BAIXA_PCT ? ' alerta-texto' : ''}`}>
                      {l.nivel_bateria_pct < LIMITE_BATERIA_BAIXA_PCT && <BatteryLow size={14} aria-label="Bateria baixa" style={{ verticalAlign: -2, marginRight: 4 }} />}
                      {l.nivel_bateria_pct}%
                    </td>
                    <td className={l.sem_sinal ? 'alerta-texto' : 'suave'}>
                      {l.sem_sinal && <WifiOff size={14} aria-label="Sem sinal" style={{ verticalAlign: -2, marginRight: 4 }} />}
                      {tempoDesde(l.ultima_atualizacao)}
                    </td>
                    <td>
                      <Selo tom={STATUS_LIXEIRA[l.status].tom}>{STATUS_LIXEIRA[l.status].rotulo}</Selo>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {cadastrando && (
        <FormLixeira
          zonas={zonas.dados ?? []}
          aoFechar={() => setCadastrando(false)}
          aoSalvar={(nova) => {
            setCadastrando(false)
            navegar(`/lixeiras/${nova.id}`)
          }}
        />
      )}
    </>
  )
}

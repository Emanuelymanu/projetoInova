import { MapPinned, Pencil, Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Barra, Carregando, MensagemErro, Modal, Selo, Vazio } from '../components/ui'
import { api } from '../lib/api'
import { PRIORIDADE, prioridadeDe } from '../lib/formatar'
import type { Zona } from '../lib/tipos'
import { useApi } from '../lib/useApi'

export function Zonas() {
  const zonas = useApi<Zona[]>('/zonas', 60_000)
  const [editando, setEditando] = useState<Zona | 'nova' | null>(null)

  return (
    <>
      <header className="cabecalho-pagina">
        <div>
          <h1>Locais</h1>
          <p>Zonas e bairros atendidos, com a situação das lixeiras de cada um</p>
        </div>
        <button type="button" className="botao" onClick={() => setEditando('nova')}>
          <Plus size={18} aria-hidden /> Novo local
        </button>
      </header>

      {zonas.erro && <MensagemErro>{zonas.erro}</MensagemErro>}
      {zonas.carregando && !zonas.dados ? (
        <Carregando />
      ) : (zonas.dados ?? []).length === 0 ? (
        <section className="cartao">
          <Vazio icone={<MapPinned size={32} aria-hidden />}>Nenhum local cadastrado.</Vazio>
        </section>
      ) : (
        <div className="grade-cartoes">
          {(zonas.dados ?? []).map((z) => (
            <article key={z.id} className="cartao" style={{ display: 'grid', gap: 14 }}>
              <div className="cartao-titulo" style={{ marginBottom: 0, alignItems: 'flex-start' }}>
                <div>
                  <h2>{z.nome}</h2>
                  <p>{z.descricao || 'Sem descrição'}</p>
                </div>
                <button type="button" className="botao-icone" onClick={() => setEditando(z)} aria-label={`Editar ${z.nome}`}>
                  <Pencil size={15} />
                </button>
              </div>
              <dl className="dados-lista">
                <dt>Lixeiras ativas</dt>
                <dd>{z.total_lixeiras}</dd>
                <dt>Cheias agora</dt>
                <dd>
                  {z.lixeiras_cheias > 0 ? (
                    <Selo tom="vermelho">{z.lixeiras_cheias} urgente{z.lixeiras_cheias > 1 ? 's' : ''}</Selo>
                  ) : (
                    <span className="suave">Nenhuma</span>
                  )}
                </dd>
              </dl>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span className="suave">Nível médio</span>
                  <strong>{z.nivel_medio_pct === null ? '–' : `${z.nivel_medio_pct}%`}</strong>
                </div>
                <Barra pct={z.nivel_medio_pct ?? 0} cor={PRIORIDADE[prioridadeDe(z.nivel_medio_pct ?? 0)].cor} />
              </div>
              <Link to={`/lixeiras?zona=${z.id}`} className="suave" style={{ fontSize: 13 }}>
                Ver lixeiras →
              </Link>
            </article>
          ))}
        </div>
      )}

      {editando && (
        <FormZona
          zona={editando === 'nova' ? undefined : editando}
          aoFechar={() => setEditando(null)}
          aoSalvar={() => {
            setEditando(null)
            zonas.recarregar()
          }}
        />
      )}
    </>
  )
}

function FormZona({ zona, aoFechar, aoSalvar }: { zona?: Zona; aoFechar: () => void; aoSalvar: () => void }) {
  const [nome, setNome] = useState(zona?.nome ?? '')
  const [descricao, setDescricao] = useState(zona?.descricao ?? '')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function aoEnviar(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setErro(null)
    try {
      const corpo = { nome: nome.trim(), descricao: descricao.trim() || null }
      await api(zona ? `/zonas/${zona.id}` : '/zonas', { metodo: zona ? 'PATCH' : 'POST', corpo })
      aoSalvar()
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível salvar.')
      setEnviando(false)
    }
  }

  return (
    <Modal titulo={zona ? `Editar ${zona.nome}` : 'Novo local'} aoFechar={aoFechar}>
      <form className="formulario" onSubmit={aoEnviar}>
        <label className="rotulo">
          Nome
          <input className="entrada" required minLength={2} maxLength={100} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Zona Oeste" />
        </label>
        <label className="rotulo">
          Descrição
          <textarea className="entrada" maxLength={500} value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Bairros e pontos de referência" />
        </label>
        {erro && <MensagemErro>{erro}</MensagemErro>}
        <div className="modal-acoes">
          <button type="button" className="botao secundario" onClick={aoFechar}>
            Cancelar
          </button>
          <button type="submit" className="botao" disabled={enviando}>
            Salvar
          </button>
        </div>
      </form>
    </Modal>
  )
}

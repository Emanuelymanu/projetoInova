import { KeyRound, Plus, UserCheck, UserX, Users } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Barra, Carregando, MensagemErro, Modal, Selo, Vazio } from '../components/ui'
import { api } from '../lib/api'
import { dataHora, iniciais, STATUS_ROTA } from '../lib/formatar'
import { useSessao } from '../lib/sessaoContexto'
import type { TipoUsuario, UsuarioComDesempenho } from '../lib/tipos'
import { useApi } from '../lib/useApi'

export function Equipe() {
  const { usuario: eu } = useSessao()
  const [tipo, setTipo] = useState<TipoUsuario>('MOTORISTA')
  const usuarios = useApi<UsuarioComDesempenho[]>(`/usuarios?tipo=${tipo}`, 30_000)
  const [criando, setCriando] = useState(false)
  const [trocandoSenha, setTrocandoSenha] = useState<UsuarioComDesempenho | null>(null)
  const [erroAcao, setErroAcao] = useState<string | null>(null)

  async function alternarAtivo(u: UsuarioComDesempenho) {
    const desativar = u.ativo
    if (desativar && !confirm(`Desativar ${u.nome}? A pessoa não conseguirá mais entrar, mas o histórico é mantido.`)) return
    setErroAcao(null)
    try {
      await api(`/usuarios/${u.id}`, { metodo: 'PATCH', corpo: { ativo: !u.ativo } })
      usuarios.recarregar()
    } catch (e) {
      setErroAcao(e instanceof Error ? e.message : 'Não foi possível alterar.')
    }
  }

  const lista = usuarios.dados ?? []
  const motoristas = tipo === 'MOTORISTA'

  return (
    <>
      <header className="cabecalho-pagina">
        <div>
          <h1>Equipe</h1>
          <p>{motoristas ? 'Motoristas cadastrados, rota de hoje e desempenho' : 'Pessoas com acesso a este painel'}</p>
        </div>
        <button type="button" className="botao" onClick={() => setCriando(true)}>
          <Plus size={18} aria-hidden /> {motoristas ? 'Novo motorista' : 'Novo gestor'}
        </button>
      </header>

      <div className="filtros">
        <div className="segmentos">
          <button type="button" aria-pressed={motoristas} onClick={() => setTipo('MOTORISTA')}>
            Motoristas
          </button>
          <button type="button" aria-pressed={!motoristas} onClick={() => setTipo('GESTOR')}>
            Gestores
          </button>
        </div>
      </div>

      {(usuarios.erro || erroAcao) && (
        <div style={{ marginBottom: 16 }}>
          <MensagemErro>{erroAcao ?? usuarios.erro}</MensagemErro>
        </div>
      )}

      <section className="cartao">
        {usuarios.carregando && !usuarios.dados ? (
          <Carregando />
        ) : lista.length === 0 ? (
          <Vazio icone={<Users size={32} aria-hidden />}>Ninguém cadastrado ainda.</Vazio>
        ) : (
          <div className="tabela-rolagem">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Situação</th>
                  {motoristas && (
                    <>
                      <th style={{ minWidth: 190 }}>Rota de hoje</th>
                      <th className="numero">Rotas feitas</th>
                      <th className="numero">Coletas</th>
                      <th className="numero">Taxa de coleta</th>
                      <th className="numero" title="Coletas comprovadas pela tag RFID ou pelo sensor">
                        Comprovadas
                      </th>
                    </>
                  )}
                  {!motoristas && <th>Cadastrado em</th>}
                  <th className="numero">Ações</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((u) => {
                  const d = u.desempenho
                  const pontos = d.coletas + d.pontos_nao_coletados
                  return (
                    <tr key={u.id} style={u.ativo ? undefined : { opacity: 0.6 }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span className={`avatar${u.ativo ? '' : ' inativo'}`}>{iniciais(u.nome)}</span>
                          <span className="celula-principal">
                            {u.nome}
                            {u.id === eu?.id && <span className="suave"> (você)</span>}
                            <small>{u.email}</small>
                          </span>
                        </div>
                      </td>
                      <td>{u.ativo ? <Selo tom="verde">Ativo</Selo> : <Selo tom="cinza">Desativado</Selo>}</td>
                      {motoristas && (
                        <>
                          <td>
                            {u.rota_hoje ? (
                              <Link to={`/rotas/${u.rota_hoje.id}`} style={{ display: 'grid', gap: 6, color: 'inherit' }}>
                                <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                                  <Selo tom={STATUS_ROTA[u.rota_hoje.status].tom}>{STATUS_ROTA[u.rota_hoje.status].rotulo}</Selo>
                                  <span className="suave">
                                    {u.rota_hoje.coletadas}/{u.rota_hoje.total_paradas}
                                  </span>
                                </span>
                                <Barra
                                  pct={u.rota_hoje.total_paradas ? (u.rota_hoje.coletadas / u.rota_hoje.total_paradas) * 100 : 0}
                                  cor="var(--verde)"
                                />
                              </Link>
                            ) : (
                              <span className="fraco">Sem rota</span>
                            )}
                          </td>
                          <td className="numero">{d.rotas_concluidas}</td>
                          <td className="numero">{d.coletas}</td>
                          <td className="numero">{pontos ? `${Math.round((d.coletas / pontos) * 100)}%` : '–'}</td>
                          <td className="numero">
                            {d.coletas ? (
                              <span className={d.coletas_comprovadas / d.coletas < 0.8 ? 'alerta-texto' : undefined}>
                                {Math.round((d.coletas_comprovadas / d.coletas) * 100)}%
                                <small className="suave" style={{ display: 'block' }}>
                                  {d.coletas_por_tag} por tag
                                </small>
                              </span>
                            ) : (
                              '–'
                            )}
                          </td>
                        </>
                      )}
                      {!motoristas && <td className="suave">{dataHora(u.criado_em)}</td>}
                      <td className="numero">
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button type="button" className="botao-icone" title="Definir nova senha" aria-label={`Definir nova senha para ${u.nome}`} onClick={() => setTrocandoSenha(u)}>
                            <KeyRound size={15} />
                          </button>
                          {u.id !== eu?.id && (
                            <button
                              type="button"
                              className="botao-icone"
                              title={u.ativo ? 'Desativar' : 'Reativar'}
                              aria-label={`${u.ativo ? 'Desativar' : 'Reativar'} ${u.nome}`}
                              onClick={() => alternarAtivo(u)}
                            >
                              {u.ativo ? <UserX size={15} /> : <UserCheck size={15} />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {criando && (
        <FormUsuario
          tipo={tipo}
          aoFechar={() => setCriando(false)}
          aoSalvar={() => {
            setCriando(false)
            usuarios.recarregar()
          }}
        />
      )}
      {trocandoSenha && <FormSenha usuario={trocandoSenha} aoFechar={() => setTrocandoSenha(null)} />}
    </>
  )
}

function FormUsuario({ tipo, aoFechar, aoSalvar }: { tipo: TipoUsuario; aoFechar: () => void; aoSalvar: () => void }) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function aoEnviar(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setErro(null)
    try {
      await api('/usuarios', { metodo: 'POST', corpo: { nome: nome.trim(), email: email.trim(), senha, tipo } })
      aoSalvar()
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível cadastrar.')
      setEnviando(false)
    }
  }

  return (
    <Modal titulo={tipo === 'MOTORISTA' ? 'Novo motorista' : 'Novo gestor'} aoFechar={aoFechar}>
      <form className="formulario" onSubmit={aoEnviar}>
        <label className="rotulo">
          Nome completo
          <input className="entrada" required minLength={2} maxLength={100} value={nome} onChange={(e) => setNome(e.target.value)} />
        </label>
        <label className="rotulo">
          E-mail
          <input className="entrada" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          {tipo === 'MOTORISTA' && <span className="ajuda">É com ele que o motorista entra no app.</span>}
        </label>
        <label className="rotulo">
          Senha inicial
          <input className="entrada" type="password" required minLength={8} maxLength={72} autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} />
          <span className="ajuda">Pelo menos 8 caracteres. Repasse para a pessoa por um canal seguro.</span>
        </label>
        {erro && <MensagemErro>{erro}</MensagemErro>}
        <div className="modal-acoes">
          <button type="button" className="botao secundario" onClick={aoFechar}>
            Cancelar
          </button>
          <button type="submit" className="botao" disabled={enviando}>
            Cadastrar
          </button>
        </div>
      </form>
    </Modal>
  )
}

function FormSenha({ usuario, aoFechar }: { usuario: UsuarioComDesempenho; aoFechar: () => void }) {
  const [senha, setSenha] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [feito, setFeito] = useState(false)

  async function aoEnviar(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setErro(null)
    try {
      await api(`/usuarios/${usuario.id}`, { metodo: 'PATCH', corpo: { senha } })
      setFeito(true)
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível alterar a senha.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Modal titulo={`Nova senha para ${usuario.nome}`} aoFechar={aoFechar}>
      {feito ? (
        <div className="formulario">
          <div className="mensagem info">Senha alterada. A pessoa já pode entrar com a nova senha.</div>
          <div className="modal-acoes">
            <button type="button" className="botao" onClick={aoFechar}>
              Fechar
            </button>
          </div>
        </div>
      ) : (
        <form className="formulario" onSubmit={aoEnviar}>
          <label className="rotulo">
            Nova senha
            <input className="entrada" type="password" required minLength={8} maxLength={72} autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} />
          </label>
          {erro && <MensagemErro>{erro}</MensagemErro>}
          <div className="modal-acoes">
            <button type="button" className="botao secundario" onClick={aoFechar}>
              Cancelar
            </button>
            <button type="submit" className="botao" disabled={enviando}>
              Salvar senha
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}

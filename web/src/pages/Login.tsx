import { Loader2, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { MensagemErro } from '../components/ui'
import { useSessao } from '../lib/sessaoContexto'

export function Login() {
  const { entrar } = useSessao()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function aoEnviar(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setErro(null)
    try {
      await entrar(email.trim().toLowerCase(), senha)
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível entrar.')
      setEnviando(false)
    }
  }

  return (
    <div className="login">
      <form className="login-cartao formulario" onSubmit={aoEnviar}>
        <div>
          <span className="marca-icone">
            <Trash2 size={26} aria-hidden />
          </span>
          <h1>Coleta Inteligente</h1>
          <p className="suave" style={{ textAlign: 'center', margin: '4px 0 12px' }}>
            Painel de monitoramento das rotas e lixeiras
          </p>
        </div>
        <label className="rotulo">
          E-mail
          <input className="entrada" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="rotulo">
          Senha
          <input
            className="entrada"
            type="password"
            autoComplete="current-password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </label>
        {erro && <MensagemErro>{erro}</MensagemErro>}
        <button className="botao" type="submit" disabled={enviando} style={{ height: 46 }}>
          {enviando && <Loader2 className="girando" size={18} aria-hidden />}
          Entrar
        </button>
      </form>
    </div>
  )
}

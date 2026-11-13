import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, ErroApi, quandoSessaoExpirar, token } from './api'
import { Contexto } from './sessaoContexto'
import type { Usuario } from './tipos'

export function SessaoProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [carregando, setCarregando] = useState(() => token.ler() !== null)

  const sair = useCallback(() => {
    token.apagar()
    setUsuario(null)
  }, [])

  useEffect(() => {
    quandoSessaoExpirar(sair)
    if (!token.ler()) return
    api<Usuario>('/auth/perfil')
      .then((u) => (u.tipo === 'GESTOR' ? setUsuario(u) : sair()))
      .catch(() => sair())
      .finally(() => setCarregando(false))
  }, [sair])

  const entrar = useCallback(async (email: string, senha: string) => {
    const resposta = await api<{ token: string; usuario: Usuario }>('/auth/login', {
      metodo: 'POST',
      corpo: { email, senha },
    })
    if (resposta.usuario.tipo !== 'GESTOR') {
      throw new ErroApi('O painel é para gestores. Motoristas usam o app no celular.')
    }
    token.salvar(resposta.token)
    setUsuario(resposta.usuario)
  }, [])

  const valor = useMemo(() => ({ carregando, usuario, entrar, sair }), [carregando, usuario, entrar, sair])
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

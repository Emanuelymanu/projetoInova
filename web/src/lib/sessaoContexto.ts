import { createContext, useContext } from 'react'
import type { Usuario } from './tipos'

export interface Sessao {
  carregando: boolean
  usuario: Usuario | null
  entrar: (email: string, senha: string) => Promise<void>
  sair: () => void
}

export const Contexto = createContext<Sessao | null>(null)

export function useSessao() {
  const contexto = useContext(Contexto)
  if (!contexto) throw new Error('useSessao precisa estar dentro de <SessaoProvider>')
  return contexto
}

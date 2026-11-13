import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from './api'

/**
 * Busca um recurso da API e, opcionalmente, atualiza a cada `intervaloMs`.
 * Ao recarregar, mantém os dados anteriores na tela até a resposta nova chegar.
 */
export function useApi<T>(caminho: string | null, intervaloMs?: number) {
  const [dados, setDados] = useState<T | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(caminho !== null)
  const [atualizadoEm, setAtualizadoEm] = useState<Date | null>(null)
  const pedidoAtual = useRef(0)

  const recarregar = useCallback(async () => {
    if (caminho === null) return
    const pedido = ++pedidoAtual.current
    try {
      const resposta = await api<T>(caminho)
      // Ignora respostas atrasadas de um filtro que já mudou.
      if (pedido !== pedidoAtual.current) return
      setDados(resposta)
      setErro(null)
      setAtualizadoEm(new Date())
    } catch (e) {
      if (pedido === pedidoAtual.current) setErro(e instanceof Error ? e.message : 'Erro ao carregar.')
    } finally {
      if (pedido === pedidoAtual.current) setCarregando(false)
    }
  }, [caminho])

  useEffect(() => {
    const primeira = setTimeout(recarregar, 0)
    const intervalo = intervaloMs ? setInterval(recarregar, intervaloMs) : undefined
    return () => {
      clearTimeout(primeira)
      clearInterval(intervalo)
    }
  }, [recarregar, intervaloMs])

  return { dados, erro, carregando, atualizadoEm, recarregar }
}

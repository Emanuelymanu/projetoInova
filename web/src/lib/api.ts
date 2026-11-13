const CHAVE_TOKEN = 'painel_token'

/** Em produção, defina VITE_API_URL; em desenvolvimento o Vite repassa /api ao backend. */
const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '/api'

export const token = {
  ler: () => {
    try {
      return localStorage.getItem(CHAVE_TOKEN)
    } catch {
      return null
    }
  },
  salvar: (valor: string) => {
    try {
      localStorage.setItem(CHAVE_TOKEN, valor)
    } catch {
      /* navegação privada: a sessão vale só nesta aba */
    }
  },
  apagar: () => {
    try {
      localStorage.removeItem(CHAVE_TOKEN)
    } catch {
      /* idem */
    }
  },
}

export class ErroApi extends Error {
  status?: number
  constructor(mensagem: string, status?: number) {
    super(mensagem)
    this.status = status
  }
}

/** Avisado quando a API responde 401, para a sessão voltar ao login. */
let aoExpirar: (() => void) | null = null
export function quandoSessaoExpirar(fn: () => void) {
  aoExpirar = fn
}

/** Chama a API e lança ErroApi com a mensagem que o usuário deve ver. */
export async function api<T>(caminho: string, { metodo = 'GET', corpo }: { metodo?: string; corpo?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = {}
  if (corpo !== undefined) headers['Content-Type'] = 'application/json'
  const atual = token.ler()
  if (atual) headers.Authorization = `Bearer ${atual}`

  let resposta: Response
  try {
    resposta = await fetch(`${BASE}${caminho}`, {
      method: metodo,
      headers,
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
    })
  } catch {
    throw new ErroApi('Não foi possível falar com o servidor. Verifique se a API está rodando.')
  }

  const dados = await resposta.json().catch(() => null)
  if (resposta.ok) return dados as T

  if (resposta.status === 401 && atual) aoExpirar?.()
  const detalhe = dados?.detalhes?.[0]
  throw new ErroApi(
    detalhe ? `${detalhe.campo}: ${detalhe.mensagem}` : (dados?.erro ?? 'Algo deu errado. Tente novamente.'),
    resposta.status,
  )
}

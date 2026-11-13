// Espelham os DTOs do backend (backend/src/services/*.service.ts).

export type TipoUsuario = 'GESTOR' | 'MOTORISTA'
export type Situacao = 'VAZIA' | 'PARCIAL' | 'CHEIA'
export type StatusLixeira = 'OPERACIONAL' | 'MANUTENCAO' | 'DESATIVADO'
export type StatusRota = 'PLANEJADA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA'
/** Como a coleta foi registrada: leitura da tag UHF, queda de nível no sensor ou toque no app. */
export type Confirmacao = 'RFID' | 'SENSOR' | 'MANUAL'
/** O que o sensor ultrassônico diz sobre uma coleta marcada (backend: comprovacao.service.ts). */
export type VerificacaoSensor = 'CONFIRMADA' | 'AGUARDANDO' | 'SEM_LEITURA' | 'NAO_DETECTADA' | 'NAO_APLICAVEL'

export interface Usuario {
  id: number
  nome: string
  email: string
  tipo: TipoUsuario
  ativo: boolean
  criado_em: string
}

export interface UsuarioComDesempenho extends Usuario {
  desempenho: {
    rotas_concluidas: number
    coletas: number
    pontos_nao_coletados: number
    coletas_por_tag: number
    coletas_comprovadas: number
  }
  rota_hoje: { id: number; status: StatusRota; total_paradas: number; coletadas: number } | null
}

export interface Lixeira {
  id: number
  codigo_identificador: string
  epc: string | null
  endereco: string | null
  latitude: number
  longitude: number
  capacidade_litros: number
  altura_cm: number
  nivel_preenchimento_pct: number
  nivel_bateria_pct: number
  situacao: Situacao
  sem_sinal: boolean
  status: StatusLixeira
  zona: { id: number; nome: string } | null
  ultima_atualizacao: string
  ultimo_esvaziamento: string | null
}

export interface Leitura {
  nivel_preenchimento_pct: number
  nivel_bateria_pct: number
  distancia_cm: number | null
  data_hora: string
}

export interface Zona {
  id: number
  nome: string
  descricao: string | null
  total_lixeiras: number
  lixeiras_cheias: number
  nivel_medio_pct: number | null
}

export interface Dashboard {
  resumo: { total: number; cheias: number; parciais: number; vazias: number; bateria_baixa: number; sem_sinal: number }
  lixeiras: Lixeira[]
  gerado_em: string
}

export interface Parada {
  id: number
  ordem_visita: number
  coletado: boolean
  data_hora_coleta: string | null
  confirmacao: Confirmacao | null
  epc_lido: string | null
  nivel_na_coleta: number | null
  esvaziada_em: string | null
  verificacao_sensor: VerificacaoSensor | null
  lixeira: Lixeira | null
}

export interface Rota {
  id: number
  nome: string
  data_rota: string
  status: StatusRota
  motorista: { id: number; nome: string; email: string } | null
  distancia_total_km: number | null
  tempo_estimado_min: number | null
  iniciada_em: string | null
  concluida_em: string | null
  criado_em: string
  total_paradas: number
  coletadas: number
  /** Coletas comprovadas pela tag ou pelo sensor. */
  comprovadas: number
  paradas: Parada[]
}

// Espelham os DTOs do backend (backend/src/services/*.service.ts).

export type TipoUsuario = 'GESTOR' | 'MOTORISTA';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  tipo: TipoUsuario;
  ativo?: boolean;
  criado_em: string;
}

export type Situacao = 'VAZIA' | 'PARCIAL' | 'CHEIA';
export type StatusLixeira = 'OPERACIONAL' | 'MANUTENCAO' | 'DESATIVADO';

export interface Lixeira {
  id: number;
  codigo_identificador: string;
  /** Código da tag UHF RFID colada na lixeira. */
  epc?: string | null;
  endereco: string | null;
  latitude: number;
  longitude: number;
  capacidade_litros: number;
  altura_cm: number;
  nivel_preenchimento_pct: number;
  nivel_bateria_pct: number;
  situacao: Situacao;
  sem_sinal: boolean;
  status: StatusLixeira;
  zona: { id: number; nome: string } | null;
  ultima_atualizacao: string;
}

/** Como a coleta foi registrada: leitura da tag, queda de nível no sensor ou toque no app. */
export type Confirmacao = 'RFID' | 'SENSOR' | 'MANUAL';

export type StatusRota = 'PLANEJADA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA';

/** Rota como a API devolve (backend/src/services/rota.service.ts). */
export interface RotaApi {
  id: number;
  nome: string;
  data_rota: string;
  status: StatusRota;
  concluida_em: string | null;
  total_paradas: number;
  coletadas: number;
  paradas: { id: number; ordem_visita: number; coletado: boolean; confirmacao: Confirmacao | null; lixeira: Lixeira | null }[];
}

/** Resumo de uma rota concluída, usado no histórico. */
export interface RotaConcluida {
  id: string;
  nome: string;
  data: string;
  pontos: number;
  coletas: number;
}

// Espelham os DTOs do backend (backend/src/services/*.service.ts).

export type TipoUsuario = 'GESTOR' | 'MOTORISTA';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  tipo: TipoUsuario;
  criado_em: string;
}

export type Situacao = 'VAZIA' | 'PARCIAL' | 'CHEIA';
export type StatusLixeira = 'OPERACIONAL' | 'MANUTENCAO' | 'DESATIVADO';

export interface Lixeira {
  id: number;
  codigo_identificador: string;
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

/** Rota finalizada no aparelho. O backend ainda não tem endpoint de rotas. */
export interface RotaConcluida {
  id: string;
  nome: string;
  data: string;
  pontos: number;
  coletas: number;
}

import type { Lixeira, RotaConcluida, Usuario } from './tipos';

// Dados usados no modo demonstração, para testar o app sem o backend rodando.

export const USUARIO_DEMO: Usuario = {
  id: 4821,
  nome: 'João Silva',
  email: 'joao.coleta@cidade.gov.br',
  tipo: 'MOTORISTA',
  criado_em: '2025-01-10T12:00:00.000Z',
};

const PONTOS: [string, string, number, number, number, number][] = [
  // codigo, zona, nível %, bateria %, lat, lng
  ['Praça Central', 'Centro', 92, 81, -23.5505, -46.6333],
  ['Av. Getúlio Vargas', 'Centro', 88, 64, -23.5521, -46.6352],
  ['Terminal Rodoviário', 'Centro', 81, 90, -23.5478, -46.6301],
  ['Parque Municipal', 'Zona Sul', 67, 55, -23.5540, -46.6290],
  ['Escola Estadual', 'Zona Sul', 41, 97, -23.5562, -46.6327],
  ['Mercado Municipal', 'Centro', 28, 18, -23.5489, -46.6368],
  ['Hospital Regional', 'Zona Sul', 12, 76, -23.5530, -46.6378],
];

export function lixeirasDemo(): Lixeira[] {
  const agora = Date.now();
  return PONTOS.map(([codigo, zona, nivel, bateria, latitude, longitude], i) => ({
    id: i + 1,
    codigo_identificador: codigo,
    // Tags de demonstração: DEMO0001, DEMO0002…
    epc: `DEMO${String(i + 1).padStart(4, '0')}`,
    endereco: null,
    latitude,
    longitude,
    capacidade_litros: 240,
    altura_cm: 100,
    nivel_preenchimento_pct: nivel,
    nivel_bateria_pct: bateria,
    situacao: nivel >= 80 ? 'CHEIA' : nivel <= 10 ? 'VAZIA' : 'PARCIAL',
    sem_sinal: false,
    status: 'OPERACIONAL',
    zona: { id: zona === 'Centro' ? 1 : 2, nome: zona },
    ultima_atualizacao: new Date(agora - (5 + i * 3) * 60_000).toISOString(),
  }));
}

export function historicoDemo(): RotaConcluida[] {
  const dia = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
  return [
    { id: 'd1', nome: 'Rota Centro', data: dia(1), pontos: 18, coletas: 17 },
    { id: 'd2', nome: 'Rota Leste', data: dia(2), pontos: 22, coletas: 22 },
    { id: 'd3', nome: 'Rota Centro', data: dia(3), pontos: 18, coletas: 16 },
    { id: 'd4', nome: 'Rota Norte', data: dia(4), pontos: 15, coletas: 15 },
  ];
}

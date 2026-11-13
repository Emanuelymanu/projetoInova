import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { api, ErroApi } from '@/services/api';
import { historicoDemo, lixeirasDemo } from '@/services/demo';
import type { Confirmacao, Lixeira, RotaApi, RotaConcluida } from '@/services/tipos';
import { useSessao } from './SessaoContext';

const INTERVALO_ATUALIZACAO_MS = 60_000;

interface RotaContexto {
  /** Nome da rota atribuída ("Rota Centro"), ou null se o motorista não tem rota hoje. */
  nomeRota: string | null;
  lixeiras: Lixeira[];
  carregando: boolean;
  erro: string | null;
  atualizadoEm: number | null;
  atualizar: () => Promise<void>;
  emAndamento: boolean;
  coletadas: Set<number>;
  historico: RotaConcluida[];
  iniciar: () => Promise<void>;
  alternarColeta: (lixeiraId: number) => Promise<void>;
  finalizar: () => Promise<void>;
  /** Como cada lixeira coletada foi registrada (tag, sensor ou manual). */
  confirmacoes: Map<number, Confirmacao>;
  /** Registra a coleta a partir do código lido na tag UHF. */
  lerTag: (epc: string) => Promise<ResultadoLeitura>;
}

export interface ResultadoLeitura {
  ok: boolean;
  mensagem: string;
}

/** Mesma normalização do backend: leitores no modo teclado podem mandar espaços ou minúsculas. */
const normalizarEpc = (valor: string) => valor.replace(/[\s:-]/g, '').toUpperCase();

const Contexto = createContext<RotaContexto | null>(null);

const paraHistorico = (r: RotaApi): RotaConcluida => ({
  id: String(r.id),
  nome: r.nome,
  data: r.concluida_em ?? r.data_rota,
  pontos: r.total_paradas,
  coletas: r.coletadas,
});

export function RotaProvider({ children }: { children: ReactNode }) {
  const { sessao } = useSessao();
  // O provider é recriado a cada login (key no _layout), então a sessão não muda aqui dentro.
  return sessao?.demo ? <RotaDemoProvider>{children}</RotaDemoProvider> : <RotaApiProvider>{children}</RotaApiProvider>;
}

/** Rota atribuída pelo gestor no painel web; cada coleta vai direto para o servidor. */
function RotaApiProvider({ children }: { children: ReactNode }) {
  const { sessao, sair } = useSessao();
  const token = sessao?.token ?? null;
  const [rota, setRota] = useState<RotaApi | null>(null);
  const [historico, setHistorico] = useState<RotaConcluida[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [atualizadoEm, setAtualizadoEm] = useState<number | null>(null);

  const tratarErro = useCallback(
    async (e: unknown) => {
      if (e instanceof ErroApi && e.status === 401) await sair();
      else setErro(e instanceof Error ? e.message : 'Algo deu errado.');
    },
    [sair],
  );

  const atualizar = useCallback(async () => {
    try {
      const [atual, concluidas] = await Promise.all([
        api<RotaApi | null>('/rotas/atual', { token }),
        api<RotaApi[]>('/rotas?status=CONCLUIDA', { token }),
      ]);
      setRota(atual);
      setHistorico(concluidas.map(paraHistorico));
      setAtualizadoEm(Date.now());
      setErro(null);
    } catch (e) {
      await tratarErro(e);
    } finally {
      setCarregando(false);
    }
  }, [token, tratarErro]);

  useAtualizacaoPeriodica(atualizar);

  const iniciar = useCallback(async () => {
    if (!rota || rota.status !== 'PLANEJADA') return;
    try {
      setRota(await api<RotaApi>(`/rotas/${rota.id}/iniciar`, { metodo: 'POST', token }));
    } catch (e) {
      await tratarErro(e);
    }
  }, [rota, token, tratarErro]);

  const alternarColeta = useCallback(
    async (lixeiraId: number) => {
      const parada = rota?.paradas.find((p) => p.lixeira?.id === lixeiraId);
      if (!rota || !parada) return;
      const coletado = !parada.coletado;
      // Atualiza a tela na hora; se o servidor recusar, a próxima resposta corrige.
      setRota({
        ...rota,
        paradas: rota.paradas.map((p) => (p.id === parada.id ? { ...p, coletado, confirmacao: coletado ? 'MANUAL' : null } : p)),
      });
      try {
        setRota(await api<RotaApi>(`/rotas/${rota.id}/paradas/${parada.id}`, { metodo: 'PATCH', corpo: { coletado }, token }));
      } catch (e) {
        setRota(rota);
        await tratarErro(e);
      }
    },
    [rota, token, tratarErro],
  );

  const finalizar = useCallback(async () => {
    if (!rota) return;
    try {
      await api<RotaApi>(`/rotas/${rota.id}/finalizar`, { metodo: 'POST', token });
    } catch (e) {
      await tratarErro(e);
    }
    await atualizar();
  }, [rota, token, tratarErro, atualizar]);

  const lerTag = useCallback(
    async (epc: string): Promise<ResultadoLeitura> => {
      if (!rota) return { ok: false, mensagem: 'Você não tem rota aberta agora.' };
      try {
        const resposta = await api<{ lixeira: string; ja_registrada: boolean; rota: RotaApi }>(
          `/rotas/${rota.id}/leituras-rfid`,
          { metodo: 'POST', corpo: { epc }, token },
        );
        setRota(resposta.rota);
        return {
          ok: true,
          mensagem: resposta.ja_registrada ? `${resposta.lixeira} já estava registrada` : `${resposta.lixeira} coletada`,
        };
      } catch (e) {
        if (e instanceof ErroApi && e.status === 401) await sair();
        return { ok: false, mensagem: e instanceof Error ? e.message : 'Não foi possível registrar a leitura.' };
      }
    },
    [rota, token, sair],
  );

  const lixeiras = useMemo(
    () => (rota?.paradas ?? []).flatMap((p) => (p.lixeira ? [p.lixeira] : [])),
    [rota],
  );
  const confirmacoes = useMemo(
    () =>
      new Map(
        (rota?.paradas ?? []).flatMap((p) => (p.coletado && p.lixeira ? [[p.lixeira.id, p.confirmacao ?? 'MANUAL'] as const] : [])),
      ),
    [rota],
  );
  const coletadas = useMemo(
    () => new Set((rota?.paradas ?? []).filter((p) => p.coletado && p.lixeira).map((p) => p.lixeira!.id)),
    [rota],
  );

  const valor = useMemo(
    () => ({
      nomeRota: rota?.nome ?? null,
      lixeiras,
      carregando,
      erro,
      atualizadoEm,
      atualizar,
      emAndamento: rota?.status === 'EM_ANDAMENTO',
      coletadas,
      historico,
      iniciar,
      alternarColeta,
      finalizar,
      confirmacoes,
      lerTag,
    }),
    [rota, lixeiras, carregando, erro, atualizadoEm, atualizar, coletadas, historico, iniciar, alternarColeta, finalizar, confirmacoes, lerTag],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

interface EstadoDemo {
  emAndamento: boolean;
  coletadas: number[];
  /** Coletadas pela leitura da tag. Pode faltar em estados salvos por versões antigas. */
  porTag?: number[];
  historico: RotaConcluida[];
}
const CHAVE_DEMO = 'rota:demo';

/** Modo demonstração: tudo local, para testar o app sem o backend. */
function RotaDemoProvider({ children }: { children: ReactNode }) {
  const [lixeiras, setLixeiras] = useState<Lixeira[]>([]);
  const [atualizadoEm, setAtualizadoEm] = useState<number | null>(null);
  const [estado, setEstado] = useState<EstadoDemo>({ emAndamento: false, coletadas: [], historico: [] });
  const carregado = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(CHAVE_DEMO)
      .then((texto) => setEstado(texto ? JSON.parse(texto) : { emAndamento: false, coletadas: [], historico: historicoDemo() }))
      .catch(() => {})
      .finally(() => {
        carregado.current = true;
      });
  }, []);

  useEffect(() => {
    if (carregado.current) AsyncStorage.setItem(CHAVE_DEMO, JSON.stringify(estado)).catch(() => {});
  }, [estado]);

  const atualizar = useCallback(async () => {
    setLixeiras(await Promise.resolve(lixeirasDemo()));
    setAtualizadoEm(Date.now());
  }, []);
  useAtualizacaoPeriodica(atualizar);

  const iniciar = useCallback(async () => setEstado((s) => ({ ...s, emAndamento: true })), []);
  const alternarColeta = useCallback(async (id: number) => {
    setEstado((s) => ({
      ...s,
      emAndamento: true,
      coletadas: s.coletadas.includes(id) ? s.coletadas.filter((c) => c !== id) : [...s.coletadas, id],
      porTag: (s.porTag ?? []).filter((c) => c !== id),
    }));
  }, []);

  const lerTag = useCallback(
    async (epc: string): Promise<ResultadoLeitura> => {
      const lixeira = lixeiras.find((l) => l.epc === normalizarEpc(epc));
      if (!lixeira) return { ok: false, mensagem: 'Tag não cadastrada. No modo demonstração, use DEMO0001 a DEMO0007.' };
      if (estado.coletadas.includes(lixeira.id)) return { ok: true, mensagem: `${lixeira.codigo_identificador} já estava registrada` };
      setEstado((s) => ({
        ...s,
        emAndamento: true,
        coletadas: [...s.coletadas, lixeira.id],
        porTag: [...(s.porTag ?? []), lixeira.id],
      }));
      return { ok: true, mensagem: `${lixeira.codigo_identificador} coletada` };
    },
    [lixeiras, estado.coletadas],
  );
  const finalizar = useCallback(async () => {
    setEstado((s) => ({
      emAndamento: false,
      coletadas: [],
      historico: [
        { id: String(Date.now()), nome: 'Rota Centro', data: new Date().toISOString(), pontos: lixeiras.length, coletas: s.coletadas.length },
        ...s.historico,
      ],
    }));
  }, [lixeiras.length]);

  const coletadas = useMemo(() => new Set(estado.coletadas), [estado.coletadas]);
  const confirmacoes = useMemo(
    () => new Map(estado.coletadas.map((id) => [id, (estado.porTag ?? []).includes(id) ? 'RFID' : 'MANUAL'] as const)),
    [estado.coletadas, estado.porTag],
  );
  const valor = useMemo(
    () => ({
      nomeRota: 'Rota Centro',
      lixeiras,
      carregando: lixeiras.length === 0 && atualizadoEm === null,
      erro: null,
      atualizadoEm,
      atualizar,
      emAndamento: estado.emAndamento,
      coletadas,
      historico: estado.historico,
      iniciar,
      alternarColeta,
      finalizar,
      confirmacoes,
      lerTag,
    }),
    [lixeiras, atualizadoEm, atualizar, estado, coletadas, iniciar, alternarColeta, finalizar, confirmacoes, lerTag],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

/** Busca ao abrir, a cada minuto e quando o app volta para a frente. */
function useAtualizacaoPeriodica(atualizar: () => Promise<void>) {
  useEffect(() => {
    // Agendada como as demais, para não atualizar estado dentro do efeito.
    const primeira = setTimeout(atualizar, 0);
    const intervalo = setInterval(atualizar, INTERVALO_ATUALIZACAO_MS);
    const assinatura = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') atualizar();
    });
    return () => {
      clearTimeout(primeira);
      clearInterval(intervalo);
      assinatura.remove();
    };
  }, [atualizar]);
}

export function useRota() {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('useRota precisa estar dentro de <RotaProvider>');
  return contexto;
}

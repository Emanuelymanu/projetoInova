import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { api, ErroApi } from '@/services/api';
import { historicoDemo, lixeirasDemo } from '@/services/demo';
import type { Lixeira, RotaConcluida } from '@/services/tipos';
import { useSessao } from './SessaoContext';

const INTERVALO_ATUALIZACAO_MS = 60_000;

/**
 * O backend ainda não tem endpoints de rotas/coletas, então o andamento da rota e o
 * histórico ficam guardados no aparelho, separados por usuário.
 */
interface EstadoLocal {
  emAndamento: boolean;
  coletadas: number[];
  historico: RotaConcluida[];
}

const ESTADO_INICIAL: EstadoLocal = { emAndamento: false, coletadas: [], historico: [] };

interface RotaContexto {
  lixeiras: Lixeira[];
  carregando: boolean;
  erro: string | null;
  atualizadoEm: number | null;
  atualizar: () => Promise<void>;
  emAndamento: boolean;
  coletadas: Set<number>;
  historico: RotaConcluida[];
  iniciar: () => void;
  alternarColeta: (id: number) => void;
  finalizar: () => RotaConcluida;
}

const Contexto = createContext<RotaContexto | null>(null);

function nomeDaRota(lixeiras: Lixeira[]): string {
  const contagem = new Map<string, number>();
  for (const l of lixeiras) if (l.zona) contagem.set(l.zona.nome, (contagem.get(l.zona.nome) ?? 0) + 1);
  const [maisComum] = [...contagem.entries()].sort((a, b) => b[1] - a[1]);
  return maisComum ? `Rota ${maisComum[0]}` : 'Rota do dia';
}

export function RotaProvider({ children }: { children: ReactNode }) {
  const { sessao, sair } = useSessao();
  const [lixeiras, setLixeiras] = useState<Lixeira[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [atualizadoEm, setAtualizadoEm] = useState<number | null>(null);
  const [local, setLocal] = useState<EstadoLocal>(ESTADO_INICIAL);
  const localCarregado = useRef(false);

  const chaveLocal = sessao ? `rota:${sessao.demo ? 'demo' : sessao.usuario.id}` : null;

  // Carrega o estado salvo do usuário atual.
  useEffect(() => {
    localCarregado.current = false;
    if (!chaveLocal) return;
    AsyncStorage.getItem(chaveLocal)
      .then((texto) => {
        if (texto) setLocal(JSON.parse(texto));
        else setLocal({ ...ESTADO_INICIAL, historico: sessao?.demo ? historicoDemo() : [] });
      })
      .catch(() => setLocal(ESTADO_INICIAL))
      .finally(() => {
        localCarregado.current = true;
      });
  }, [chaveLocal, sessao?.demo]);

  useEffect(() => {
    if (chaveLocal && localCarregado.current) AsyncStorage.setItem(chaveLocal, JSON.stringify(local)).catch(() => {});
  }, [chaveLocal, local]);

  const atualizar = useCallback(async () => {
    if (!sessao) return;
    try {
      const dados = await (sessao.demo
        ? Promise.resolve(lixeirasDemo())
        : api<Lixeira[]>('/lixeiras', { token: sessao.token }));
      // Lixeiras desativadas não entram na rota (mesmo critério do dashboard do backend).
      setLixeiras(dados.filter((l) => l.status !== 'DESATIVADO'));
      setAtualizadoEm(Date.now());
      setErro(null);
    } catch (e) {
      if (e instanceof ErroApi && e.status === 401) {
        await sair();
        return;
      }
      setErro(e instanceof Error ? e.message : 'Erro ao carregar as lixeiras.');
    } finally {
      setCarregando(false);
    }
  }, [sessao, sair]);

  useEffect(() => {
    // Primeira busca agendada como as demais, para não atualizar estado dentro do efeito.
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

  const iniciar = useCallback(() => setLocal((s) => ({ ...s, emAndamento: true })), []);

  const alternarColeta = useCallback((id: number) => {
    setLocal((s) => ({
      ...s,
      emAndamento: true,
      coletadas: s.coletadas.includes(id) ? s.coletadas.filter((c) => c !== id) : [...s.coletadas, id],
    }));
  }, []);

  const finalizar = useCallback(() => {
    const idsAtuais = new Set(lixeiras.map((l) => l.id));
    const rota: RotaConcluida = {
      id: String(Date.now()),
      nome: nomeDaRota(lixeiras),
      data: new Date().toISOString(),
      pontos: lixeiras.length,
      coletas: local.coletadas.filter((id) => idsAtuais.has(id)).length,
    };
    setLocal((s) => ({ emAndamento: false, coletadas: [], historico: [rota, ...s.historico] }));
    return rota;
  }, [lixeiras, local.coletadas]);

  const coletadas = useMemo(() => new Set(local.coletadas), [local.coletadas]);

  const valor = useMemo(
    () => ({
      lixeiras,
      carregando,
      erro,
      atualizadoEm,
      atualizar,
      emAndamento: local.emAndamento,
      coletadas,
      historico: local.historico,
      iniciar,
      alternarColeta,
      finalizar,
    }),
    [lixeiras, carregando, erro, atualizadoEm, atualizar, local, coletadas, iniciar, alternarColeta, finalizar],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useRota() {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('useRota precisa estar dentro de <RotaProvider>');
  return contexto;
}

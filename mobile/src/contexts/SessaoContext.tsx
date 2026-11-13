import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, ErroApi } from '@/services/api';
import { USUARIO_DEMO } from '@/services/demo';
import type { Usuario } from '@/services/tipos';

const CHAVE = 'sessao';

interface SessaoSalva {
  token: string | null;
  usuario: Usuario;
  demo: boolean;
}

interface SessaoContexto {
  carregando: boolean;
  sessao: SessaoSalva | null;
  entrar: (email: string, senha: string) => Promise<void>;
  entrarDemo: () => Promise<void>;
  sair: () => Promise<void>;
}

const Contexto = createContext<SessaoContexto | null>(null);

export function SessaoProvider({ children }: { children: ReactNode }) {
  const [carregando, setCarregando] = useState(true);
  const [sessao, setSessao] = useState<SessaoSalva | null>(null);

  const salvar = useCallback(async (nova: SessaoSalva | null) => {
    setSessao(nova);
    if (nova) await AsyncStorage.setItem(CHAVE, JSON.stringify(nova));
    else await AsyncStorage.removeItem(CHAVE);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const texto = await AsyncStorage.getItem(CHAVE);
        const salva: SessaoSalva | null = texto ? JSON.parse(texto) : null;
        if (salva && !salva.demo && salva.token) {
          // Confere se o token ainda vale (expira em 8h no backend).
          try {
            const usuario = await api<Usuario>('/auth/perfil', { token: salva.token });
            salva.usuario = usuario;
          } catch (erro) {
            // Sem rede mantém a sessão; 401 significa token vencido.
            if (erro instanceof ErroApi && erro.status === 401) {
              await salvar(null);
              return;
            }
          }
        }
        setSessao(salva);
      } finally {
        setCarregando(false);
      }
    })();
  }, [salvar]);

  const entrar = useCallback(
    async (email: string, senha: string) => {
      const { token, usuario } = await api<{ token: string; usuario: Usuario }>('/auth/login', {
        metodo: 'POST',
        corpo: { email, senha },
      });
      if (usuario.tipo !== 'MOTORISTA') throw new ErroApi('Este app é dos motoristas. Gestores usam o painel web.');
      await salvar({ token, usuario, demo: false });
    },
    [salvar],
  );

  const entrarDemo = useCallback(() => salvar({ token: null, usuario: USUARIO_DEMO, demo: true }), [salvar]);
  const sair = useCallback(() => salvar(null), [salvar]);

  const valor = useMemo(
    () => ({ carregando, sessao, entrar, entrarDemo, sair }),
    [carregando, sessao, entrar, entrarDemo, sair],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSessao() {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('useSessao precisa estar dentro de <SessaoProvider>');
  return contexto;
}

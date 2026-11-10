import Constants from 'expo-constants';

/**
 * No Expo Go o celular não enxerga "localhost" do computador. Por padrão usamos o
 * mesmo IP de onde o Metro está servindo o app, na porta do backend (3000).
 * Para apontar para outro servidor, defina EXPO_PUBLIC_API_URL no arquivo .env.
 */
function descobrirUrlApi(): string {
  const definida = process.env.EXPO_PUBLIC_API_URL;
  if (definida) return definida.replace(/\/$/, '');

  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  return `http://${host ?? 'localhost'}:3000/api`;
}

export const URL_API = descobrirUrlApi();

export class ErroApi extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
  }
}

const TEMPO_LIMITE_MS = 10_000;

/** Chama a API e lança ErroApi com a mensagem que o usuário deve ver. */
export async function api<T>(
  caminho: string,
  { metodo = 'GET', corpo, token }: { metodo?: string; corpo?: unknown; token?: string | null } = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (corpo) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const controle = new AbortController();
  const temporizador = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);

  let resposta: Response;
  try {
    resposta = await fetch(`${URL_API}${caminho}`, {
      method: metodo,
      headers,
      body: corpo ? JSON.stringify(corpo) : undefined,
      signal: controle.signal,
    });
  } catch {
    throw new ErroApi(`Não foi possível falar com o servidor (${URL_API}).`);
  } finally {
    clearTimeout(temporizador);
  }

  const dados = await resposta.json().catch(() => null);
  if (resposta.ok) return dados as T;

  const detalhe = dados?.detalhes?.[0];
  throw new ErroApi(
    detalhe ? `${detalhe.campo}: ${detalhe.mensagem}` : (dados?.erro ?? 'Algo deu errado. Tente novamente.'),
    resposta.status,
  );
}

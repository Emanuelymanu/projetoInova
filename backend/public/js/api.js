const CHAVE_TOKEN = 'lixeiras_token';

const sessao = {
  token: () => localStorage.getItem(CHAVE_TOKEN),
  salvar: (token) => localStorage.setItem(CHAVE_TOKEN, token),
  encerrar: () => localStorage.removeItem(CHAVE_TOKEN),
};

/** Chama a API e lança um Error com a mensagem que o usuário deve ver. */
async function api(caminho, { metodo = 'GET', corpo } = {}) {
  const headers = {};
  if (corpo) headers['Content-Type'] = 'application/json';
  if (sessao.token()) headers.Authorization = `Bearer ${sessao.token()}`;

  let resposta;
  try {
    resposta = await fetch(`/api${caminho}`, {
      method: metodo,
      headers,
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
  } catch {
    throw new Error('Não foi possível falar com o servidor.');
  }

  const dados = await resposta.json().catch(() => null);
  if (resposta.ok) return dados;

  const erro = new Error(
    dados?.detalhes?.[0]
      ? `${dados.detalhes[0].campo}: ${dados.detalhes[0].mensagem}`
      : dados?.erro ?? 'Algo deu errado. Tente novamente.',
  );
  erro.status = resposta.status;
  throw erro;
}

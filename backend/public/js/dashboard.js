if (!sessao.token()) location.replace('/');

const INTERVALO_ATUALIZACAO_MS = 15_000;
const LIMITE_BATERIA_BAIXA = 20;

const SITUACOES = {
  CHEIA: { texto: 'Cheia', icone: '!' },
  PARCIAL: { texto: 'Parcial', icone: '~' },
  VAZIA: { texto: 'Vazia', icone: '✓' },
};

const el = (id) => document.getElementById(id);

const estado = { lixeiraId: null, lixeiras: [], leituras: [], horas: 24 };

function criar(tag, { classe, texto } = {}, ...filhos) {
  const elemento = document.createElement(tag);
  if (classe) elemento.className = classe;
  if (texto !== undefined) elemento.textContent = texto;
  elemento.append(...filhos);
  return elemento;
}

const formatarDataHora = (valor) =>
  new Date(valor).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

function encerrarSessao() {
  sessao.encerrar();
  location.replace('/');
}

/** Sessão expirada volta ao login; os demais erros ficam visíveis sem apagar os dados na tela. */
function tratarErro(erro) {
  if (erro.status === 401) {
    encerrarSessao();
    return;
  }
  el('erro-dashboard').textContent = erro.message;
  el('erro-dashboard').hidden = false;
}

function criarLinhaLixeira(lixeira) {
  const situacao = SITUACOES[lixeira.situacao];
  const linha = criar('tr');
  if (lixeira.id === estado.lixeiraId) linha.className = 'selecionada';

  const botao = criar('button', { classe: 'botao-lixeira', texto: lixeira.codigo_identificador });
  botao.type = 'button';
  botao.setAttribute('aria-label', `Ver histórico de ${lixeira.codigo_identificador}`);
  botao.addEventListener('click', () => selecionarLixeira(lixeira.id));

  const celulaSituacao = criar(
    'td',
    {},
    criar(
      'span',
      { classe: `situacao situacao-${lixeira.situacao}` },
      criar('span', { classe: 'situacao-icone', texto: situacao.icone }),
      situacao.texto,
    ),
  );
  if (lixeira.sem_sinal) celulaSituacao.append(criar('span', { classe: 'alerta', texto: '· sem sinal' }));

  const preenchimento = criar('span', { classe: 'nivel-preenchimento' });
  preenchimento.style.width = `${lixeira.nivel_preenchimento_pct}%`;

  const bateriaBaixa = lixeira.nivel_bateria_pct < LIMITE_BATERIA_BAIXA;
  linha.append(
    criar('td', {}, botao),
    criar('td', { classe: 'coluna-zona', texto: lixeira.zona?.nome ?? 'Sem zona' }),
    celulaSituacao,
    criar(
      'td',
      {},
      criar(
        'div',
        { classe: `nivel nivel-${lixeira.situacao}` },
        criar('span', { classe: 'nivel-trilho' }, preenchimento),
        criar('span', { classe: 'nivel-valor', texto: `${lixeira.nivel_preenchimento_pct}%` }),
      ),
    ),
    criar('td', {
      classe: 'numero',
      texto: `${bateriaBaixa ? '⚠ ' : ''}${lixeira.nivel_bateria_pct}%`,
    }),
    criar('td', { texto: formatarDataHora(lixeira.ultima_atualizacao) }),
  );
  return linha;
}

function renderizarResumo(resumo) {
  el('total-cheias').textContent = resumo.cheias;
  el('rotulo-cheias').textContent =
    resumo.cheias === 1 ? 'lixeira cheia precisa de coleta' : 'lixeiras cheias precisam de coleta';
  el('total-lixeiras').textContent = resumo.total;
  el('total-parciais').textContent = resumo.parciais;
  el('total-vazias').textContent = resumo.vazias;
  el('total-bateria').textContent = resumo.bateria_baixa;
  el('total-sem-sinal').textContent = resumo.sem_sinal;
}

function renderizarLixeiras() {
  // As linhas são recriadas a cada atualização; sem isto o foco do teclado se perderia.
  const focado = document.activeElement?.getAttribute('aria-label');
  el('linhas-lixeiras').replaceChildren(...estado.lixeiras.map(criarLinhaLixeira));
  if (focado) {
    [...el('linhas-lixeiras').querySelectorAll('button')]
      .find((botao) => botao.getAttribute('aria-label') === focado)
      ?.focus();
  }
  el('sem-lixeiras').hidden = estado.lixeiras.length > 0;
}

function renderizarHistorico({ forcar = false } = {}) {
  const lixeira = estado.lixeiras.find((l) => l.id === estado.lixeiraId);
  el('cartao-historico').hidden = !lixeira;
  if (!lixeira) return;

  // Sem leitura nova, mantém o gráfico: redesenhar fecharia a dica e tiraria o foco dele.
  const ultima = estado.leituras[estado.leituras.length - 1];
  const chave = [lixeira.id, estado.horas, estado.leituras.length, ultima?.data_hora].join('|');
  if (!forcar && chave === estado.chaveHistorico) return;
  estado.chaveHistorico = chave;

  el('titulo-historico').textContent = `Histórico de ${lixeira.codigo_identificador}`;
  el('sem-historico').hidden = estado.leituras.length > 0;
  el('tabela-historico-detalhes').hidden = estado.leituras.length === 0;
  desenharGrafico(el('grafico'), estado.leituras, estado.horas);

  const linhas = [...estado.leituras].reverse().map((leitura) =>
    criar(
      'tr',
      {},
      criar('td', { texto: formatarDataHora(leitura.data_hora) }),
      criar('td', { classe: 'numero', texto: `${leitura.nivel_preenchimento_pct}%` }),
      criar('td', { classe: 'numero', texto: `${leitura.nivel_bateria_pct}%` }),
      criar('td', { classe: 'numero', texto: `${leitura.distancia_cm} cm` }),
    ),
  );
  el('linhas-historico').replaceChildren(...linhas);
}

async function carregarHistorico() {
  if (estado.lixeiraId === null) {
    estado.leituras = [];
    return;
  }
  const id = estado.lixeiraId;
  const leituras = await api(`/lixeiras/${id}/historico?horas=${estado.horas}`);
  // Ignora a resposta se o usuário já trocou de lixeira enquanto ela chegava.
  if (id === estado.lixeiraId) estado.leituras = leituras;
}

async function atualizar() {
  try {
    const zonaId = el('filtro-zona').value;
    const dados = await api(`/dashboard${zonaId ? `?zonaId=${zonaId}` : ''}`);

    estado.lixeiras = dados.lixeiras;
    if (!estado.lixeiras.some((l) => l.id === estado.lixeiraId)) {
      estado.lixeiraId = estado.lixeiras[0]?.id ?? null;
    }
    await carregarHistorico();

    renderizarResumo(dados.resumo);
    renderizarLixeiras();
    renderizarHistorico();
    el('erro-dashboard').hidden = true;
    el('atualizado-em').textContent =
      `Atualizado às ${new Date(dados.gerado_em).toLocaleTimeString('pt-BR')}`;
  } catch (erro) {
    tratarErro(erro);
  }
}

async function selecionarLixeira(id) {
  estado.lixeiraId = id;
  renderizarLixeiras();
  try {
    await carregarHistorico();
    renderizarHistorico();
  } catch (erro) {
    tratarErro(erro);
  }
}

async function iniciar() {
  el('sair').addEventListener('click', encerrarSessao);
  el('filtro-zona').addEventListener('change', atualizar);
  el('filtro-horas').addEventListener('change', (evento) => {
    estado.horas = Number(evento.target.value);
    atualizar();
  });

  let redimensionamento;
  window.addEventListener('resize', () => {
    clearTimeout(redimensionamento);
    redimensionamento = setTimeout(() => renderizarHistorico({ forcar: true }), 150);
  });

  try {
    const [usuario, zonas] = await Promise.all([api('/auth/perfil'), api('/zonas')]);
    el('usuario-nome').textContent = usuario.nome;
    for (const zona of zonas) {
      const opcao = criar('option', { texto: zona.nome });
      opcao.value = zona.id;
      el('filtro-zona').append(opcao);
    }
  } catch (erro) {
    tratarErro(erro);
    return;
  }

  await atualizar();
  setInterval(atualizar, INTERVALO_ATUALIZACAO_MS);
}

if (sessao.token()) iniciar();

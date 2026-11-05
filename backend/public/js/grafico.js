/* Gráfico de linha do nível (0-100%) em SVG, sem bibliotecas externas. */

const SVG_NS = 'http://www.w3.org/2000/svg';
const ALTURA_GRAFICO = 240;
const MARGEM = { topo: 14, direita: 44, base: 26, esquerda: 38 };
const LIMITE_CHEIA = 80;

function criarSvg(pai, tag, atributos = {}, texto) {
  const elemento = document.createElementNS(SVG_NS, tag);
  for (const [nome, valor] of Object.entries(atributos)) elemento.setAttribute(nome, valor);
  if (texto !== undefined) elemento.textContent = texto;
  pai.appendChild(elemento);
  return elemento;
}

function formatarEixoTempo(data, horas) {
  return horas <= 24
    ? data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function desenharGrafico(container, leituras, horas) {
  container.replaceChildren();
  if (!leituras.length) return;

  const largura = Math.max(container.clientWidth, 280);
  const pontos = leituras.map((l) => ({
    tempo: new Date(l.data_hora),
    nivel: l.nivel_preenchimento_pct,
  }));

  const fim = Date.now();
  const inicio = fim - horas * 3_600_000;
  const areaLargura = largura - MARGEM.esquerda - MARGEM.direita;
  const areaAltura = ALTURA_GRAFICO - MARGEM.topo - MARGEM.base;
  const x = (tempo) => MARGEM.esquerda + ((tempo.getTime() - inicio) / (fim - inicio)) * areaLargura;
  const y = (nivel) => MARGEM.topo + (1 - nivel / 100) * areaAltura;
  const base = y(0);

  const ultimo = pontos[pontos.length - 1];
  const svg = criarSvg(container, 'svg', {
    viewBox: `0 0 ${largura} ${ALTURA_GRAFICO}`,
    height: ALTURA_GRAFICO,
    role: 'img',
    tabindex: '0',
    'aria-label': `Nível ao longo do tempo: ${pontos.length} leituras, a última em ${ultimo.nivel}%. Use as setas para percorrer as leituras.`,
  });

  for (const nivel of [0, 25, 50, 75, 100]) {
    criarSvg(svg, 'line', {
      class: nivel === 0 ? 'base' : 'grade',
      x1: MARGEM.esquerda,
      x2: largura - MARGEM.direita,
      y1: y(nivel),
      y2: y(nivel),
    });
    criarSvg(svg, 'text', {
      x: MARGEM.esquerda - 8,
      y: y(nivel) + 4,
      'text-anchor': 'end',
    }, `${nivel}%`);
  }

  // Limite de "cheia", para ler o gráfico sem depender da tabela.
  criarSvg(svg, 'line', {
    class: 'base',
    x1: MARGEM.esquerda,
    x2: largura - MARGEM.direita,
    y1: y(LIMITE_CHEIA),
    y2: y(LIMITE_CHEIA),
  });
  const rotuloLimite = {
    class: 'rotulo-limite',
    x: MARGEM.esquerda + 6,
    y: y(LIMITE_CHEIA) - 5,
  };

  const qtdTicks = largura < 480 ? 3 : 5;
  for (let i = 0; i < qtdTicks; i += 1) {
    const tempo = new Date(inicio + ((fim - inicio) * i) / (qtdTicks - 1));
    const ancora = i === 0 ? 'start' : i === qtdTicks - 1 ? 'end' : 'middle';
    criarSvg(svg, 'text', {
      x: x(tempo),
      y: ALTURA_GRAFICO - 6,
      'text-anchor': ancora,
    }, formatarEixoTempo(tempo, horas));
  }

  const caminho = pontos
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.tempo).toFixed(1)},${y(p.nivel).toFixed(1)}`)
    .join(' ');

  if (pontos.length > 1) {
    const primeiroX = x(pontos[0].tempo).toFixed(1);
    const ultimoX = x(ultimo.tempo).toFixed(1);
    criarSvg(svg, 'path', {
      class: 'area',
      d: `${caminho} L${ultimoX},${base} L${primeiroX},${base} Z`,
    });
    criarSvg(svg, 'path', { class: 'linha', d: caminho });
  }

  // Desenhado depois da linha para continuar legível quando os dados passam por ele.
  criarSvg(svg, 'text', rotuloLimite, `cheia a partir de ${LIMITE_CHEIA}%`);

  criarSvg(svg, 'circle', { class: 'ponto', cx: x(ultimo.tempo), cy: y(ultimo.nivel), r: 5 });
  criarSvg(svg, 'text', {
    class: 'rotulo-final',
    x: x(ultimo.tempo) + 9,
    y: y(ultimo.nivel) + 4,
  }, `${ultimo.nivel}%`);

  const mira = criarSvg(svg, 'line', {
    class: 'mira',
    y1: MARGEM.topo,
    y2: base,
    visibility: 'hidden',
  });
  const pontoAtivo = criarSvg(svg, 'circle', { class: 'ponto', r: 5, visibility: 'hidden' });

  const dica = document.createElement('div');
  dica.className = 'dica';
  dica.hidden = true;
  const dicaValor = document.createElement('strong');
  const dicaData = document.createElement('span');
  dica.append(dicaValor, dicaData);
  container.appendChild(dica);

  let indiceAtivo = pontos.length - 1;

  function mostrar(indice) {
    indiceAtivo = indice;
    const ponto = pontos[indice];
    const px = x(ponto.tempo);
    const py = y(ponto.nivel);

    mira.setAttribute('x1', px);
    mira.setAttribute('x2', px);
    mira.setAttribute('visibility', 'visible');
    pontoAtivo.setAttribute('cx', px);
    pontoAtivo.setAttribute('cy', py);
    pontoAtivo.setAttribute('visibility', 'visible');

    dicaValor.textContent = `${ponto.nivel}%`;
    dicaData.textContent = ponto.tempo.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    dica.hidden = false;
    const escala = container.clientWidth / largura;
    const esquerda = px * escala + 12;
    const cabe = esquerda + dica.offsetWidth < container.clientWidth;
    dica.style.left = `${cabe ? esquerda : px * escala - dica.offsetWidth - 12}px`;
  }

  function ocultar() {
    mira.setAttribute('visibility', 'hidden');
    pontoAtivo.setAttribute('visibility', 'hidden');
    dica.hidden = true;
  }

  function maisProximo(tempoMs) {
    let melhor = 0;
    pontos.forEach((ponto, i) => {
      const distancia = Math.abs(ponto.tempo.getTime() - tempoMs);
      if (distancia < Math.abs(pontos[melhor].tempo.getTime() - tempoMs)) melhor = i;
    });
    return melhor;
  }

  svg.addEventListener('pointermove', (evento) => {
    const caixa = svg.getBoundingClientRect();
    const svgX = (evento.clientX - caixa.left) * (largura / caixa.width);
    mostrar(maisProximo(inicio + ((svgX - MARGEM.esquerda) / areaLargura) * (fim - inicio)));
  });
  svg.addEventListener('pointerleave', ocultar);
  svg.addEventListener('focus', () => mostrar(indiceAtivo));
  svg.addEventListener('blur', ocultar);
  svg.addEventListener('keydown', (evento) => {
    if (evento.key === 'ArrowLeft') mostrar(Math.max(0, indiceAtivo - 1));
    else if (evento.key === 'ArrowRight') mostrar(Math.min(pontos.length - 1, indiceAtivo + 1));
    else return;
    evento.preventDefault();
  });
}

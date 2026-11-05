if (sessao.token()) location.replace('/dashboard');

const abas = {
  login: { aba: document.getElementById('aba-login'), form: document.getElementById('form-login') },
  cadastro: { aba: document.getElementById('aba-cadastro'), form: document.getElementById('form-cadastro') },
};
const mensagemErro = document.getElementById('mensagem-erro');

function mostrarErro(texto) {
  mensagemErro.textContent = texto;
  mensagemErro.hidden = !texto;
}

function selecionarAba(nome) {
  for (const [chave, { aba, form }] of Object.entries(abas)) {
    aba.setAttribute('aria-selected', String(chave === nome));
    form.hidden = chave !== nome;
  }
  mostrarErro('');
}

abas.login.aba.addEventListener('click', () => selecionarAba('login'));
abas.cadastro.aba.addEventListener('click', () => selecionarAba('cadastro'));

function aoEnviar(form, caminho) {
  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    mostrarErro('');
    const botao = form.querySelector('button[type="submit"]');
    botao.disabled = true;
    try {
      const corpo = Object.fromEntries(new FormData(form));
      const { token } = await api(caminho, { metodo: 'POST', corpo });
      sessao.salvar(token);
      location.replace('/dashboard');
    } catch (erro) {
      mostrarErro(erro.message);
      botao.disabled = false;
    }
  });
}

aoEnviar(abas.login.form, '/auth/login');
aoEnviar(abas.cadastro.form, '/auth/cadastro');

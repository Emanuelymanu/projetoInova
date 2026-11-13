# App mobile — Coleta Inteligente

App do motorista feito com Expo (SDK 58) e Expo Router. Abre no **Expo Go**.

## Rodar

```bash
cd mobile
npm install
npx expo start
```

Escaneie o QR code com o Expo Go (Android) ou com a câmera (iOS). O celular precisa estar na mesma rede Wi-Fi do computador.

## Backend

O app usa a API em `backend/` e, por padrão, procura por ela em `http://<IP do computador>:3000/api`, que é o mesmo IP que o Expo usa para servir o app.

- Suba o banco (`docker compose up -d`) e a API (`cd backend && npm run dev`).
- Login de teste: `joao.coleta@cidade.gov.br` / `senha123`. Para aparecer uma rota, crie uma para ele no painel web.
- Se o Windows perguntar, libere a porta 3000 no firewall para redes privadas.
- Para usar outro endereço, crie `mobile/.env` com `EXPO_PUBLIC_API_URL=http://192.168.0.10:3000/api` e reinicie com `npx expo start --clear`.

Sem o backend, toque em **"Testar sem servidor"** na tela de login para usar dados de demonstração.

## Telas

| Aba | O que mostra |
| --- | --- |
| Início | Status dos sensores, resumo da rota do dia, alerta de pontos urgentes, mapa e botão de iniciar rota |
| Rota | Pontos da rota na ordem de visita, com filtros, nível de preenchimento e o botão de marcar como coletada |
| Histórico | Rotas finalizadas (completa ou parcial) |
| Perfil | Dados do usuário e o botão de sair |

Prioridade: **alta** a partir de 80% (o mesmo limite de "cheia" do backend), **atenção** de 50% a 79%, e **OK** abaixo disso.

## Rotas

O gestor monta a rota no painel web (`web/`) e atribui a um motorista. O app mostra a rota em andamento ou a próxima planejada até hoje (`GET /api/rotas/atual`). Cada coleta marcada vai na hora para o servidor, então o painel acompanha o progresso ao vivo. Sem rota atribuída, a tela inicial avisa que não há rota hoje.

Só motoristas entram no app; gestores usam o painel web. No modo demonstração, a rota e o histórico ficam apenas no aparelho.

## Leitura da tag RFID

Na tela **Rota**, o botão **Ler tag** abre o leitor. Ele funciona com leitores UHF Bluetooth (ou coletores Android com leitor embutido) configurados no **modo teclado** (HID ou "keyboard wedge"): o leitor digita o código da tag e manda Enter, e o app registra a coleta na hora. Nesse modo não há código nativo, então funciona no Expo Go.

- Configure o leitor para mandar **Enter** depois de cada código.
- O celular vibra uma vez quando a coleta é registrada e três vezes quando a tag não é desta rota ou não está cadastrada.
- Sem leitor, ative "Mostrar o teclado" e digite o código. No modo demonstração, as tags são `DEMO0001` a `DEMO0007`.
- O botão **Coletar** de cada ponto continua existindo para tag danificada, mas a coleta fica registrada como manual.

Se o leitor escolhido só funcionar pelo SDK do fabricante, o app vai precisar de um development build (`npx expo run:android`), porque o Expo Go não carrega SDKs nativos.

## Estrutura

```
src/
  app/            telas (Expo Router): login, (tabs)/index, rota, historico, perfil
  components/     Texto, Cabecalho, CartaoPonto, MapaRota, BarraNivel, Selo
  contexts/       SessaoContext (login/token) e RotaContext (lixeiras, coletas, histórico)
  services/       cliente da API, tipos e dados de demonstração
  utils/          prioridade, datas e distâncias
  theme.ts        cores e fontes
```

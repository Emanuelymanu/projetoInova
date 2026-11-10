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
- Login de teste: `joao.coleta@cidade.gov.br` / `senha123`.
- Se o Windows perguntar, libere a porta 3000 no firewall para redes privadas.
- Para usar outro endereço, crie `mobile/.env` com `EXPO_PUBLIC_API_URL=http://192.168.0.10:3000/api` e reinicie com `npx expo start --clear`.

Sem o backend, toque em **"Testar sem servidor"** na tela de login para usar dados de demonstração.

## Telas

| Aba | O que mostra |
| --- | --- |
| Início | Status dos sensores, resumo da rota do dia, alerta de pontos urgentes, mapa e botão de iniciar rota |
| Rota | Lixeiras por prioridade, com filtros, nível de preenchimento e o botão de marcar como coletada |
| Histórico | Rotas finalizadas (completa ou parcial) |
| Perfil | Dados do usuário e o botão de sair |

Prioridade: **alta** a partir de 80% (o mesmo limite de "cheia" do backend), **atenção** de 50% a 79%, e **OK** abaixo disso.

## Limitações atuais

A API ainda não tem endpoints de rotas e coletas, apesar de as tabelas `rotas` e `rota_paradas` existirem no banco. Por isso:

- a rota do dia é formada por todas as lixeiras que não estão desativadas;
- as coletas marcadas e o histórico ficam salvos apenas no aparelho (AsyncStorage), separados por usuário.

Quando esses endpoints existirem, basta trocar a parte local em `src/contexts/RotaContext.tsx`.

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

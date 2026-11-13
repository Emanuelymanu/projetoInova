# Painel web — Coleta Inteligente

Painel dos gestores para acompanhar lixeiras, montar rotas e ver o trabalho dos motoristas. Feito com React, Vite e TypeScript, no mesmo tema escuro do app do motorista.

## Rodar

Com o banco e a API no ar (veja `backend/README.md`):

```bash
cd web
npm install
npm run dev
```

Abra <http://localhost:5173> e entre como gestor: `gestor@cidade.gov.br` / `senha123`. Motoristas não entram no painel; eles usam o app.

Em desenvolvimento, o Vite repassa `/api` para `http://localhost:3000`. Para outra porta, rode com `API_PROXY=http://localhost:3001 npm run dev`. Para publicar, rode `npm run build` e defina `VITE_API_URL` com o endereço da API.

## Páginas

| Página | O que tem |
| --- | --- |
| Visão geral | Indicadores do dia, mapa das lixeiras, alertas (cheias sem rota, sensor sem sinal, bateria baixa) e o progresso das rotas de hoje |
| Rotas | Rotas por período, situação e motorista. Cada rota mostra os pontos, o mapa e as coletas ao vivo, e pode ser encerrada ou cancelada |
| Nova rota | O sistema sugere as lixeiras com 50% ou mais que ainda não estão em rota naquele dia. O gestor ajusta, escolhe o motorista e a data. A ordem de visita começa pela mais cheia e segue para a mais próxima |
| Lixeiras | Tabela ou mapa com busca e filtros, cadastro de lixeiras e a página de cada uma com o gráfico do nível e a edição |
| Locais | Zonas com quantidade de lixeiras, cheias e nível médio |
| Equipe | Motoristas com a rota de hoje e o desempenho, cadastro, nova senha e ativar/desativar. A aba Gestores lista quem acessa o painel |

## Comprovação das coletas

Cada coleta mostra como foi registrada: **Tag RFID** (o leitor do motorista leu a tag da lixeira), **Sensor** (o sensor ultrassônico viu a lixeira ser esvaziada) ou **Manual** (toque no app). Ao lado aparece o que o sensor viu depois, por exemplo "Esvaziamento detectado" ou "Sem queda de nível".

- Na **Visão geral**, coletas marcadas sem queda de nível aparecem nos alertas.
- Na **Equipe**, a coluna Comprovadas mostra a parte das coletas de cada motorista confirmada por tag ou sensor; abaixo de 80% ela fica em destaque.
- No cadastro da lixeira, o campo **Código da tag RFID (EPC)** guarda o código da tag. Com o leitor no modo teclado, basta clicar no campo e ler a tag.

As cores de prioridade são as mesmas do app: urgente a partir de 80% (o limite de "cheia" do backend), atenção de 50% a 79% e OK abaixo disso. A cor sempre vem acompanhada de ícone e texto.

## Mapa

Usa os mapas do OpenStreetMap com Leaflet, sem chave de API, escurecidos por um filtro CSS. O servidor de mapas do OpenStreetMap é para uso leve; com muitos acessos, troque `TILES` em `src/components/Mapa.tsx` por um provedor próprio.

## Estrutura

```
src/
  pages/        uma tela por arquivo
  components/   Layout (menu), Mapa, GraficoHistorico, FormLixeira e peças da interface (ui.tsx)
  lib/          cliente da API, sessão, useApi (busca com atualização periódica), tipos e formatação
  index.css     cores e estilos
```

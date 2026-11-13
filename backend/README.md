# Backend - Lixeiras Inteligentes

API em Node.js, Express, TypeScript e MySQL. Recebe as leituras do sensor instalado na tampa da lixeira, faz login e cadastro de usuários e serve o dashboard.

## Como rodar

Na raiz do projeto, suba o banco:

```powershell
docker compose up -d
```

Na pasta `backend`:

```powershell
npm install
Copy-Item .env.example .env   # só se ainda não existir; depois troque os segredos
npm run dev
```

Abra <http://localhost:3000>. Os usuários de teste têm a senha `senha123`:

| E-mail | Tipo |
|---|---|
| `gestor@cidade.gov.br` | GESTOR |
| `joao.coleta@cidade.gov.br` | MOTORISTA |

### Banco criado antes desta versão

O `init.sql` só roda quando o volume do MySQL é criado. Se o banco já existia, aplique as migrações que ainda faltam, em ordem e uma única vez cada, a partir da raiz do projeto:

```powershell
Get-Content migrations\001_altura_senhas_localizacao.sql | docker exec -i residuos_mysql mysql --default-character-set=utf8mb4 -uadmin -padminpassword residuos_iot_db
Get-Content migrations\002_rotas_painel.sql | docker exec -i residuos_mysql mysql --default-character-set=utf8mb4 -uadmin -padminpassword residuos_iot_db
Get-Content migrations\003_comprovacao_coleta.sql | docker exec -i residuos_mysql mysql --default-character-set=utf8mb4 -uadmin -padminpassword residuos_iot_db
```

Para ter mais lixeiras, zonas e motoristas de exemplo (opcional, só em desenvolvimento), rode também `migrations\seed_demo.sql` do mesmo jeito. Os motoristas de exemplo usam a senha `senha123`.

## Estrutura

```text
src/
  config/       variáveis de ambiente, banco e limites (cheia, vazia, sem sinal)
  models/       tabelas do banco (Sequelize)
  validators/   formato dos dados de entrada (Zod)
  services/     regras de negócio
  controllers/  recebem a requisição e devolvem a resposta
  middlewares/  autenticação, chave do sensor e tratamento de erros
  routes/       mapa de URLs da API
  utils/        cálculo do nível e classe de erro
public/         páginas de login, cadastro e dashboard
```

Cada requisição percorre `routes -> middlewares -> controllers -> services -> models`.

## Rotas

Todas começam com `/api`. "Token" significa enviar o header `Authorization: Bearer <token>`.

| Método | Rota | Acesso | Função |
|---|---|---|---|
| POST | `/auth/cadastro` | Público | Cria conta do tipo MOTORISTA |
| POST | `/auth/login` | Público | Devolve o token (válido por 8 horas) |
| GET | `/auth/perfil` | Token | Dados do usuário logado |
| GET | `/usuarios?tipo=` | Token de gestor | Lista usuários com desempenho e rota de hoje |
| POST | `/usuarios` | Token de gestor | Cria usuário de qualquer tipo |
| PATCH | `/usuarios/:id` | Token de gestor | Altera nome, senha ou ativa/desativa |
| POST | `/telemetria` | Chave do sensor | Registra uma leitura |
| GET | `/dashboard?zonaId=` | Token | Resumo e lista de lixeiras |
| GET | `/zonas` | Token | Lista as zonas com total de lixeiras, cheias e nível médio |
| POST | `/zonas` | Token de gestor | Cria uma zona |
| PATCH | `/zonas/:id` | Token de gestor | Edita uma zona |
| GET | `/lixeiras?zonaId=` | Token | Lista as lixeiras |
| POST | `/lixeiras` | Token de gestor | Cadastra uma lixeira |
| GET | `/lixeiras/:id` | Token | Detalhes de uma lixeira |
| PATCH | `/lixeiras/:id` | Token de gestor | Edita dados, local e status (operacional, manutenção, desativada) |
| GET | `/lixeiras/:id/historico?horas=24` | Token | Leituras do período (1 a 720 horas) |
| GET | `/rotas?data=&de=&ate=&status=&motoristaId=` | Token | Lista rotas. O motorista só vê as próprias |
| GET | `/rotas/atual` | Token de motorista | Rota em andamento ou a próxima planejada até hoje (`null` se não houver) |
| POST | `/rotas` | Token de gestor | Cria rota: `{ motorista_id, data_rota, lixeira_ids }`, na ordem de visita |
| GET | `/rotas/:id` | Token | Rota com as paradas e o nível atual de cada lixeira |
| POST | `/rotas/:id/iniciar` | Token | Marca a rota como em andamento |
| PATCH | `/rotas/:id/paradas/:paradaId` | Token | Marca ou desmarca a coleta à mão: `{ coletado }` |
| POST | `/rotas/:id/leituras-rfid` | Token | Registra a coleta pela tag lida: `{ epc }`. Recusa tags de lixeiras fora da rota |
| POST | `/rotas/:id/finalizar` | Token | Encerra a rota; pontos não marcados ficam como não coletados |
| POST | `/rotas/:id/cancelar` | Token de gestor | Cancela uma rota que ainda não foi encerrada |

Nas ações de rota, o motorista só pode mexer na própria rota. Rotas encerradas ou canceladas não aceitam mais alterações.

## Enviando dados do sensor

O sensor envia a distância medida da tampa até o lixo, com a chave `SENSOR_API_KEY` do `.env` no header `x-api-key`. A lixeira precisa estar cadastrada.

```http
POST /api/telemetria
Content-Type: application/json
x-api-key: <SENSOR_API_KEY>

{ "codigo_identificador": "LIX-001", "distancia_cm": 35, "nivel_bateria_pct": 90 }
```

`nivel_bateria_pct` é opcional. A API converte a distância em nível usando a altura da lixeira (`altura_cm`):

```text
nível (%) = (altura - distância) / altura x 100
```

| Situação | Nível |
|---|---|
| VAZIA | até 10% |
| PARCIAL | de 11% a 79% |
| CHEIA | 80% ou mais |

A lixeira aparece como "sem sinal" depois de 60 minutos sem leitura. Esses limites ficam em [src/config/constants.ts](src/config/constants.ts).

### Comprovação da coleta

Cada coleta registra como foi marcada (`confirmacao` na parada):

| Origem | Quando |
|---|---|
| `RFID` | O leitor UHF do motorista leu a tag da lixeira (`POST /rotas/:id/leituras-rfid`) |
| `SENSOR` | O sensor viu a lixeira ser esvaziada enquanto ela estava pendente numa rota em andamento |
| `MANUAL` | O motorista tocou em "Coletar" no app |

O EPC de cada tag fica no cadastro da lixeira (campo `epc`). O código é normalizado (sem espaços, em maiúsculas), porque leitores no modo teclado podem mandar o código formatado.

O sensor conta como prova de esvaziamento quando o nível cai pelo menos 30 pontos e termina em até 20% (ex.: de 85% para 6%). Nesse caso:

- coletas marcadas há até 90 minutos ganham a confirmação do sensor (`esvaziada_em`);
- se a lixeira está pendente numa única rota **em andamento**, a parada é marcada como coletada por `SENSOR`;
- rotas apenas planejadas não são tocadas: o motorista ainda não saiu, e a coleta não pode entrar no desempenho dele.

Cada parada coletada traz `verificacao_sensor`:

| Valor | Significado |
|---|---|
| `CONFIRMADA` | O sensor viu o esvaziamento |
| `AGUARDANDO` | Ainda dentro dos 90 minutos, esperando a próxima leitura |
| `SEM_LEITURA` | Passaram 90 minutos e o sensor não mandou leitura |
| `NAO_DETECTADA` | O sensor mandou leitura depois da coleta e o nível não caiu: vale conferir |
| `NAO_APLICAVEL` | A lixeira estava abaixo de 30% na coleta, então não há queda a esperar |

Os limites ficam em [src/config/constants.ts](src/config/constants.ts). A janela de 90 minutos supõe o sensor enviando a cada 15 a 30 minutos.

Para testar sem o sensor, no PowerShell:

```powershell
$chave = (Select-String -Path .env -Pattern '^SENSOR_API_KEY=(.+)').Matches.Groups[1].Value
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/telemetria `
  -Headers @{ 'x-api-key' = $chave } -ContentType 'application/json' `
  -Body '{"codigo_identificador":"LIX-003","distancia_cm":15,"nivel_bateria_pct":80}'
```

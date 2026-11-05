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

O `init.sql` só roda quando o volume do MySQL é criado. Se o banco já existia, aplique a migração uma única vez, a partir da raiz do projeto:

```powershell
Get-Content migrations\001_altura_senhas_localizacao.sql | docker exec -i residuos_mysql mysql -uadmin -padminpassword residuos_iot_db
```

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
| POST | `/usuarios` | Token de gestor | Cria usuário de qualquer tipo |
| POST | `/telemetria` | Chave do sensor | Registra uma leitura |
| GET | `/dashboard?zonaId=` | Token | Resumo e lista de lixeiras |
| GET | `/zonas` | Token | Lista as zonas |
| GET | `/lixeiras?zonaId=` | Token | Lista as lixeiras |
| POST | `/lixeiras` | Token de gestor | Cadastra uma lixeira |
| GET | `/lixeiras/:id` | Token | Detalhes de uma lixeira |
| GET | `/lixeiras/:id/historico?horas=24` | Token | Leituras do período (1 a 720 horas) |

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

Para testar sem o sensor, no PowerShell:

```powershell
$chave = (Select-String -Path .env -Pattern '^SENSOR_API_KEY=(.+)').Matches.Groups[1].Value
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/telemetria `
  -Headers @{ 'x-api-key' = $chave } -ContentType 'application/json' `
  -Body '{"codigo_identificador":"LIX-003","distancia_cm":15,"nivel_bateria_pct":80}'
```

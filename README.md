# Meter Reading API

API para leitura automática de medidores de água, gás e energia elétrica via inteligência artificial. Você tira uma foto do hidrômetro, manda pra API, e ela devolve o valor — usando o Gemini (Google) pra fazer a leitura.

Esse projeto surgiu como desafio técnico de uma vaga em 2024 e acabou virando um bom exemplo de como estruturar uma API Node.js com DDD sem exagerar na complexidade.

---

## O que faz

- Recebe a foto de um medidor em **base64** e extrai o valor via **Gemini 1.5 Flash**
- Permite **confirmar ou corrigir** o valor lido pela IA
- **Lista** todas as leituras de um cliente, com filtro opcional por tipo
- Valida duplicidade: **uma leitura por tipo por mês** por cliente
- Autenticação simples por **API Key** no header

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Express 4 |
| Linguagem | TypeScript 5 (strict) |
| IA | Google Gemini 1.5 Flash |
| Banco | SQLite via better-sqlite3 |
| Validação | Zod |
| Logs | Pino |
| Docs | Swagger / OpenAPI 3.0 |
| Testes | Jest + Supertest |

## Arquitetura

```
src/
├── domain/          → entidades, erros e interfaces (sem dependências externas)
├── application/     → casos de uso (orquestração)
├── infrastructure/  → SQLite, Gemini, storage local
├── presentation/    → controller, rotas, middlewares, Swagger
└── shared/          → container de dependências, logger
```

Seguindo DDD-lite: domínio isolado, infraestrutura injetada via interfaces, casos de uso sem acoplar ao framework.

---

## Como rodar

### Pré-requisitos

- Node.js 20+
- Chave da API do Gemini → [aistudio.google.com](https://aistudio.google.com/app/apikey)

### Setup

```bash
git clone https://github.com/Guilhermevang/measure-api
cd measure-api
git checkout feat/v2

npm install
cp .env.example .env
# edite o .env com sua GEMINI_API_KEY
```

### Rodando

```bash
npm run dev      # desenvolvimento (hot reload)
npm start        # produção (compila antes)
```

A API sobe em `http://localhost:8800` por padrão.

### Com Docker

```bash
cp .env.example .env
# edite o .env com sua GEMINI_API_KEY

docker compose up --build
```

---

## Documentação interativa

Acesse `http://localhost:8800/docs` após subir a API.

A spec completa em JSON fica em `/docs.json`.

---

## Rotas

### `POST /api/upload`

Processa a foto de um medidor e retorna o valor lido pela IA.

```bash
curl -X POST http://localhost:8800/api/upload \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sua_chave" \
  -d '{
    "image": "<base64 da imagem>",
    "customer_code": "cliente-001",
    "measure_datetime": "2024-08-15T10:30:00Z",
    "measure_type": "WATER"
  }'
```

`measure_type` aceita: `WATER`, `GAS` ou `ELECTRICITY`

**Resposta:**
```json
{
  "image_url": "http://localhost:8800/images/abc123-water-meter.jpg",
  "measure_value": 12345,
  "measure_uuid": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### `PATCH /api/confirm`

Confirma ou corrige o valor lido. Pode ser feito apenas uma vez por leitura.

```bash
curl -X PATCH http://localhost:8800/api/confirm \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sua_chave" \
  -d '{
    "measure_uuid": "550e8400-e29b-41d4-a716-446655440000",
    "confirmed_value": 12350
  }'
```

**Resposta:**
```json
{ "success": true }
```

---

### `GET /api/:customer_code/list`

Lista todas as leituras de um cliente.

```bash
# Todas as leituras
curl http://localhost:8800/api/cliente-001/list \
  -H "X-API-Key: sua_chave"

# Filtrado por tipo
curl "http://localhost:8800/api/cliente-001/list?measure_type=WATER" \
  -H "X-API-Key: sua_chave"
```

**Resposta:**
```json
{
  "customer_code": "cliente-001",
  "measures": [
    {
      "measure_uuid": "550e8400-...",
      "measure_datetime": "2024-08-15T10:30:00.000Z",
      "measure_type": "WATER",
      "has_confirmed": false,
      "image_url": "http://localhost:8800/images/abc123-water-meter.jpg"
    }
  ]
}
```

---

## Testando com Bruno

Tem uma coleção [Bruno](https://www.usebruno.com/) pronta na pasta `bruno/`. Basta importar a pasta no app e configurar a variável `apiKey` no ambiente.

> Bruno é open-source, os arquivos `.bru` ficam no git — diferente do Postman.

---

## Autenticação

Se a variável `API_KEY` estiver definida no `.env`, todas as rotas exigem o header:

```
X-API-Key: sua_chave_aqui
```

Se não estiver definida, a verificação é ignorada (bom pra testes rápidos locais).

---

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `GEMINI_API_KEY` | Sim | Chave da API do Google Gemini |
| `API_KEY` | Não | Chave de autenticação da API |
| `APP_BASE_URL` | Não | URL base para gerar URLs de imagens (default: `http://localhost:PORT`) |
| `PORT` | Não | Porta do servidor (default: `8800`) |
| `LOG_LEVEL` | Não | Nível de log: `trace`, `debug`, `info`, `warn`, `error` (default: `info`) |

---

## Testes

```bash
npm test
```

27 testes ao todo: unitários (casos de uso com mocks) e E2E (banco SQLite em memória + Gemini mockado).

---

## Como gerar o base64 da imagem

```bash
# Linux/macOS
base64 -i foto_do_medidor.jpg

# Windows (PowerShell)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("foto_do_medidor.jpg"))
```

# Estabelecimento de Tarefas Frontend / Integração

## 1. Infraestrutura base

- **Objetivo:** manter webpack/entry atual (`src/index.js`) e carregar CSS/JS.
- **Entrega:** garantir index.css + scripts integrados aos bundles (dist/js + dist/css). Dependência mínima: nenhum endpoint.
- **Checklist:**
  - [x] Confirmar ponto de entrada (`src/index.js`).
  - [ ] Criar `apiService` que padroniza requests.
  - [ ] Criar `authStore` e `uiStore` para estado global.

## 2. Serviço de API (contrato pronto)

- **Dependências:** `docs/contrato-de-integracao.md` e backend `POST /auth/login`, `GET /auth/profile`, etc.
- **Tarefas:**
  - [ ] Implementar wrapper fetch com `credentials: 'include'`, tratamento de erros e toasts.
  - [ ] Criar typings/interfaces para payloads (login, appointments, professionals).
  - [ ] Criar helpers para GET/POST com cache opcional.

## 3. Componentes e módulos reutilizáveis

- **Objetivo:** Ensinar consistência (botões, loaders, toasts, modais, cards de erro).
- **Dependências:** `apiService`, `authStore`.
- **Tarefas:**
  - [ ] Montar `Modal`, `Toast`, `DataTable` e `FormField` com validação básica.
  - [ ] Criar utilitários de formatação (datas, moeda, status RN).

## 4. Páginas críticas de integração (auth + dashboards)

- **1) Login/Register:** `POST /auth/login`, `POST /auth/register`, `GET /auth/profile`.
- **2) Dashboard Paciente:** `GET /appointments?patient_id`, `GET /professionals`, `GET /exams?patient_id`, `GET /prescriptions?patient_id`.
- **3) Agendamento / Slots:** `GET /professionals/:id/availability`, `POST /appointments`, `POST /appointments/:id/cancel`, `POST /appointments/:id/reschedule`.
- **Checklist:**
  - [ ] Criar páginas com seções de carregamento/erro.
  - [ ] Garantir filtros e pesquisa nas listagens.
  - [ ] Incorporar RN-01 a RN-05 no fluxo de agendamento.

## 5. Integração com Fluxo do Backend já existente

- Priorizar testes manuais das rotas listadas, validando payloads (ex: `SLOT_NOT_AVAILABLE`).
- Registrar logs ao falhar para acelerar solução de bugs.

> A sequência é: infra → API → componentes → páginas principais. Cada etapa depende do conjunto anterior para manter a entrega previsível.

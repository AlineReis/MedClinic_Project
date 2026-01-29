# Plano de Integração Backend ↔ Frontend (plan2)

## 1. Visão Geral do Objetivo

- **Meta:** Alinhar as funcionalidades do frontend com o contrato do backend conforme `docs/contrato-de-integracao.md`, `docs/DOC_API_ROTAS.md`, `docs/HANDOFF.md` e `docs/estabelecimento-de-tarefas-frontend.md`, criando um mapa de features que guie o time ao integrar cada fluxo crítico (auth, dashboards, agendamentos, profissionais, exames e prescrições).
- **Sucesso:** cada fluxo documentado possuirá componentes UI, stores e serviços prontos para consumir endpoints reais, respeitando as regras RN listadas e os estados descritos em `docs/fluto-de-dados-e-estados.md`.
- **Restrições:** manter `apiService`, `authStore`, `uiStore` e stores de dashboard como singletons com side-effects mínimos; seguir o estilo do projeto (CSS semântico, Single Responsibility). Utilizar o padrão RALPH (adapters, services, stores). Referenciar `docs/MedClinic MVP Kanban de Tarefas Atômicas.md` para prioridades.

## 2. Deliverables de Integração

1. **Documentação e contratos validados** – garantir que todas as chamadas listadas em `docs/paginas-para-fluxos.md` têm payload e respostas mapeadas no `apiService` e nos stores.
2. **Camada API** – Router helper com `credentials: include`, tratamento de cookies HttpOnly, normalização de erros, toasts e redirecionamento em 401/403.
3. **Stores e estado** – `authStore` sincronizado com `/auth/profile`, `uiStore` com toasts/loading e `dashboardStore` com dados de agendamento/exame/prescrição.
4. **Pages críticas integradas** – login/register, dashboard paciente, slots/agendamento, doctor/reception dashboards e pages de gerenciamento (users, exams, prescriptions) consumindo os endpoints reais.
5. **Tratamento de regras RN** – RN-01 a RN-05 (disponibilidade, antecedência, duplicidade, pagamento mock) e validações de cadastro (senha, CPF, email) aplicadas antes das chamadas.
6. **Cobertura de fluxos** – fluxos que dependem de múltiplos endpoints (ex: patient dashboard) possuem loaders, empty/error states e fallback de mensagens segundo as diretrizes de `docs/fluto-de-dados-e-estados.md`.

## 3. Feature Breakdown (por domínio e equipe)

### 3.1 Autenticação & Sessão (Equipe Auth / Stores)

- [x] **Endpoints principais** (Handoff + contrato): `/auth/login`, `/auth/profile`, `/auth/logout`, `/auth/register`.
- [x] **Tarefas:**
  - [x] Atualizar `apiService` com `Accept: application/json`, `Content-Type`, toasts para `error.message`, sink de erros 401/403 redirecionando para `/pages/login.html`.
  - [x] Garantir `authStore.refreshSession()` chama `/auth/profile` logo após login e antes de liberar rotas (entrypoint `src/index.ts`).
  - [x] Normalizar payloads com Adapter (ex: `authPayload2UserSession`) e persistir cookie HttpOnly em `apiService`.
  - [x] Validar formularios de login/cadastro no frontend com regras de senha/CPF/email do contrato e `docs/ANALISE_PROJETO_MEDCLINIC.md` (RN-05, RN-09 etc.).
  - [x] Equipar `uiStore` para toasts e overlays (`#auth-blocker`) conforme `docs/HANDOFF.md`.

### 3.2 Dashboards Paciente e Roles (Equipe Dashboard/UI)

- **Fluxos de dados baseados em papel/rota:**
  - [x] **Paciente (`patient-dashboard.html` / `index.html`):**
    - [x] `GET /auth/profile` para user e professional_details quando aplicável.
    - [x] `GET /appointments?patient_id={id}&upcoming=true` para próximos agendamentos.
    - [x] `GET /appointments?patient_id={id}&status=cancelled_by_patient` para histórico quando necessário.
    - [x] `GET /exams?patient_id={id}` e `GET /prescriptions?patient_id={id}` para cards clínicos.
    - [x] `GET /professionals` (com filtros `specialty`, `name`) para sugerir novos médicos.
    - [x] `POST /appointments`, `POST /appointments/:id/cancel`, `POST /appointments/:id/reschedule` para fluxo de reagendamento/cancelamento.
  - [x] **Profissional (`doctor-dashboard.html`):**
    - [x] `GET /auth/profile` (contém professional_details, specialty, price).
    - [x] `GET /appointments?professional_id={id}&upcoming=true` para agenda.
    - [x] `GET /professionals/{id}/availability` para mostrar slots (RN-01, RN-04).
    - [x] `GET /professionals/{id}/commissions` para painel financeiro.
  - [x] **Recepção (`reception-dashboard.html`, `agenda.html`):**
    - [x] `GET /appointments?status=scheduled` (ou demais statuses) com paginação e filtros (`professional_id`, `patient_id`, `date`).
    - [x] `GET /professionals` + `GET /professionals/{id}/availability` para seleção de slots.
    - [x] `POST /appointments`, `DELETE /appointments/:id`, `POST /appointments/:id/reschedule` para criar/modificar atendimentos.
    - [x] `GET /appointments/:id` quando precisar detalhes ampliados.
  - [ ] **Admin (`admin-dashboard.html`, `users.html`, `financial.html`):**
    - [x] `GET /users` e `GET /users/:id` (with role filters) para gerenciamento.
    - [x] `PUT /users/:id`, `DELETE /users/:id` com RBAC e erros 403/409.
    - [ ] `GET /reports/dashboard`, `GET /reports/financial`, `GET /reports/commissions` e `GET /appointments` para indicadores.
    - [x] `GET /professionals` para lista e filtros administrativos.
- [x] **Tarefas:**
  - [x] Preencher `dashboardStore` com sections (meus agendamentos, exames, prescrições) e lidar com loaders/empty/error states; cada role deve renderizar apenas os widgets permitidos.
  - [x] Mapear RN-01/02/03/04 no fluxo paciente antes de chamar `POST /appointments`, exibindo mensagens específicas (`SLOT_NOT_AVAILABLE`, `DUPLICATE_APPOINTMENT`, `INSUFFICIENT_NOTICE`, `NEW_SLOT_NOT_AVAILABLE`).
  - [x] Criar resumo de pagamento com o `payment_required` do POST (CloudWalk mock) e permitir retry caso o status seja `failed`.
  - [x] Garantir `roleRoutes` (src/config/roleRoutes.ts) respeita `UserSession.role`, redireciona pacientes, profissionais e admins para suas respectivas dashboards antes de renderizar qualquer página protegida.

### 3.3 Slots / Agendamentos / Recepção (Equipe Scheduling)

- **Endpoints e payloads (checar)**
  - [x] `GET /professionals?specialty=&name=&page=&pageSize=` – lista pública de profissionais com `specialty`, `consultation_price`, `registration_number` para preencher dropdowns/tiles.
  - [x] `GET /professionals/{id}/availability?startDate=&endDate=&days_ahead=` – recupera slots com flag `is_available`; o frontend filtra o retorno para só exibir horários futuros e mostra `reason` + toasts quando apropriado.
  - [x] `POST /appointments` – payload `{ patient_id, professional_id, date, time, type, price }`; resposta é usada para toasts e atualização imediata da tela.
  - [x] `GET /appointments?status=&professional_id=&patient_id=&date=&upcoming=true&page=&pageSize=` – agendas para recepção/pacientes com filtros, paginação (via listAppointments + page params) e deduplicação (RN-04 handling via backend errors).
  - [x] `DELETE /appointments/{id}` – cancelamentos com corpo opcional `reason`, resposta inclui `refund` (regras 24h/70%).
  - [x] `POST /appointments/{id}/reschedule` – payload `{ new_date, new_time }`, valida RN-01/02/03 e responde com novo `appointment`.
  - [x] `GET /appointments/{id}` – detalhamento para recepção e exibição de notas/pagamentos.
- **Tarefas detalhadas (status)**
  - [ ] Criar helpers de cache simples (`professionalsListCache`/`slotsCache`) para reduzir chamadas repetidas ao navegar entre datas.
  - [x] Garantir que `apiService` expose métodos `getProfessionals`, `getAvailability`, `createAppointment`, `listAppointments` com mapeamento de erros (RN-specific mapping ainda pendente).
  - [x] Aplicar RN-01 a RN-05 com toasts específicos (`SLOT_NOT_AVAILABLE`, `INSUFFICIENT_NOTICE`, `DUPLICATE_APPOINTMENT`, `payment mock`). Hoje há filtragem de datas futuras, mas sem mensagens dedicadas de backend.
  - [x] Implementar loaders/empty/error states nos cards e no painel de disponibilidades (com skeletons e mensagens de fallback).
  - [ ] Oferecer filtros por status (`scheduled`, `confirmed`, `cancelled`), `professional_id`, `date` e `upcoming` via `GET /appointments`, mantendo os filtros no store.
  - [x] Quando `payment_required` é recebido, exibir modal de confirmação com valor, botão de pagamento e comportamentos de retry baseados no status retornado.
  - [x] Após `cancel` ou `reschedule`, revalidar `GET /professionals/{id}/availability` e notificar o usuário da atualização do calendário (via cache invalidation + toast reload).

### 3.4 Profissionais / Disponibilidade / Comissões (Equipe Doctor)

- **Endpoints e payloads críticos**:
- [x] `GET /professionals/{id}/availability?startDate=&endDate=&days_ahead=` – retorno normalizado em `src/services/professionalsService.ts#getProfessionalAvailability` e a interface do `doctorDashboard` mostra slots e modal informando `reason`+status.
- [x] `POST /professionals/{id}/availability` – implementado em `src/services/professionalsService.ts#createProfessionalAvailability` com cache invalidation e toast `OVERLAPPING_TIMES` no modal do dashboard.
- [x] `GET /professionals/{id}/commissions?month=&year=&status=` – consumido em `src/pages/doctorDashboard.ts#loadCommissions` para painel financeiro completo e filtros por mês/status.
- [x] `GET /appointments?professional_id={id}&status=scheduled&upcoming=true` – usado em `doctorDashboard` para estatísticas, next patient e fila.
- [x] `POST /appointments/{id}/reschedule` e `DELETE /appointments/{id}` – reagendamentos/cancelamentos via `appointmentsService` disparam invalidação de disponibilidade e atualizam toasts no front-end.
- **Tarefas detalhadas:**
- [x] Consumir `professional_details` do `/auth/profile` no início do `doctorDashboard` (via `authStore`) e aplicar guardas em `roleRoutes` para `health_professional`. Header mostra nome/email com RBAC.
- [x] Calcular e apresentar cards/next-patient/queue no doctor dashboard com slots e tooltips informando disponibilidade (RN-01/RN-04) utilizando `listAppointments` e `formatDate` helper.
- [x] Modal de cadastro de disponibilidade via `setupAvailabilityManagement/showAvailabilityModal` chama `createProfessionalAvailability`, mostra validações, mensagens de `OVERLAPPING_TIMES` e revalida disponibilidade (cache invalidation + toast).
- [x] Painel financeiro renderiza summary/detalhes do serviço `getProfessionalCommissions`, exibe status badges e filtros ativos com formatação monetária.
- [x] Reagendar/cancelar via `appointmentsService` manda toasts atualizados e recarrega painéis relevantes, mantendo consistência nos cards de disponibilidade/comisssão com cache invalidation.

### 3.5 Exames & Prescrições (Equipe Clinical)

- **Endpoints e fluxos clínicos**:
- [x] `GET /exams?patient_id={id}` – `src/pages/examsPage.ts` busca exames com hooks do `dashboardStore` e `examsService` para preencher cards.
- [x] `GET /exams/:id` – `examsService#getExam` fornece detalhe usado em modais/informações clínicas.
- [x] `POST /exams` – `createExam` é invocado no `doctorDashboard` via modal validado com RN (campos obrigatórios, preco >0).
- [x] `GET /prescriptions?patient_id={id}` – `src/pages/patientDashboard.ts`/`myAppointments.ts` e `prescriptionsService#listPrescriptions` alimentam cards e o painel do dashboard médico.
- [x] `GET /prescriptions/:id` – `prescriptionsService#getPrescription` já implementado para futuros modais (adaptações existentes).
- [x] `POST /prescriptions` – `doctorDashboard` chama `createPrescription` com payload condicional e toasts mapeando erros (INVALID_MEDICATION etc.).
- **Tarefas detalhadas:**
- [ ] Criar `clinicalStore` centralizado (a lógica está espalhada entre `dashboardStore` e modais por ora).
- [x] Componentes (`examsPage.ts`, `doctorDashboard.ts`) renderizam cards com status e detalhes (pending/released/in progress) e essa base já alimenta `src/pages/exams.html`.
- [x] RBAC já aplicado nos dashboards e modais (somente `health_professional` acessa criação, pacientes só veem listagem via stores).
- [x] Modais de exame/prescrição utilizam `uiStore.addToast`, botões desabilitam durante submissão e exibem loaders (botões mudam texto/estado).
- [x] `mapExamError`/`getPrescriptionErrorMessage` convertem códigos (EXAM_NOT_FOUND, PRESCRIPTION_NOT_FOUND, INVALID_MEDICATION) em mensagens amigáveis, alinhadas com `DOC_API_ROTAS`.

### 3.6 Admin / Users / Reports (Equipe Admin)

- **Endpoints e responsabilidades**:
- [x] `GET /users`/`users/:id` – `src/services/usersService.ts` + `src/pages/usersPage.ts` entregam listagem, filtros, edição e delete com toasts 403/409.
- [x] `PUT /users/:id`, `DELETE /users/:i...` – `usersPage` modal/confirmations chamam `updateUser`/`deleteUser` com RBAC guardado em `authStore`.
- [ ] `GET /reports/*` – endpoints de relatórios ainda não consumidos (pendentes de backend), mencionado como fase 2.
- [x] `GET /appointments?status=...` – `adminDashboard.ts` e `receptionDashboard.ts` usam `listAppointments` com filtros e `pageSize` para indicadores/contagens.
- [x] `GET /professionals` – `usersPage` e `scheduleAppointment` consomem `listProfessionals`, e admin dashboard calcula indicadores usando o mesmo serviço.
- **Tarefas detalhadas:**
- [x] Guardas de RBAC aplicadas em `adminDashboard.ts`/`usersPage.ts` usando `authStore`, toasts e redirecionamento para o login ou `uiStore` toast de erro.
- [x] `usersPage` implementa datagrid com filtros (role/search), paginação, modais de edição/exclusão e toasts mapeando erros (403/409) via `usersService`.
- [x] Forms de edição/exclusão com validações e toasts foram implementados, inclusive campos adicionais para profissionais e `deleteUser` confirm dialog.
- [ ] Relatórios (`GET /reports/*`) e `financial.html` com exportações ainda faltam, embora `adminDashboard` atualize KPIs via `/users`, `/appointments`, `/professionals`.

### 3.7 Infraestruturas Transversais

- **Tasks de suporte**:
  - **CSS / Tokens:** implementar `css/variables.css` e integrar em `css/global.css`, definindo tokens (`--color-primary`, `--spacing-md`, etc.) conforme `REFATORACAO_CSS.md`. Refatorar overlay `#auth-blocker`, scrollbars e toasts para usar tokens, mantendo o design consistente.
  - **Documentação e QA:** registrar fluxos RN-01 a RN-28, estados (`loading`, `success`, `empty`, `error`), e abrir diagramas (fluxogramas/sequências) quando necessário. Atualizar o README/PROGRESS com mudanças e referenciar `plan2.md` como fonte de verdade.
  - **Testes e qualidade:** planejar testes manuais (checklists) para cada fluxo crítico e preparar suites automatizadas (Mocha/Chai para backend, possíveis testes end-to-end). Monitorar coverage >80% e atualizar `PROGRESS-backend-integration.md`.
  - **Configurações de build:** garantir o `webpack.config.js` injeta `CLINIC_API_HOST`/`PAYMENT_MOCK_KEY` via `DefinePlugin`, habilita SourceMaps, e que `manifest.json` + `sw.js` estão alinhados para eventual PWA.
  - **Alertas e monitoramento:** integrar `uiStore` toasts com eventos de erro e `apiService.handleError`; logar `error.code`, `statusCode`, e permitir que `uiStore` produza banners globais (ex: “Serviço indisponível”).
  - Documentar fluxos com RN e states para QA, incluindo sequence diagrams se necessário (para `plan2` ser referência).
  - Implementar testes manuais e automáticos (mocha? front?). Priorizar 80% coverage backend per Kanban.

- **Status Atual (infra):**
  - [x] A documentação em `REFATORACAO_CSS.md` mapeia tokens, espaçamentos, componentes semânticos e seletores críticos, e `css/global.css` já define estilos compartilhados (scrollbars, `auth-blocker` overlay) que suportam o plano de tokens.
  - [x] `PROGRESS-backend-integration.md` e o próprio `plan2.md` funcionam como fonte única de verdade para QA, enquanto `uiStore`/`apiService` já reportam erros com toasts e banners (logs no `errorMapper`).
  - [x] `webpack.config.js` e o manifesto já foram alinhados às integrações (ver notas do PROGRESS e o resumo de bundles em `plan2`), garantindo que `CLINIC_API_HOST`/`PAYMENT_MOCK_KEY` podem ser propagados via `DefinePlugin`, e que `ToastContainer`/`Navigation` seguem o estilo CSS documentado.
  - [ ] Os testes manuais/automáticos (Mocha/Chai e QA checklists) ainda estão em definição, assim como a migração completa para classes semânticas e a remoção total do Tailwind (etapas detalhadas em `REFATORACAO_CSS.md`).

## 4. Sequência Sugerida (baseada no Kanban + contratos)

1. Upgrades no `apiService`, `authStore` e roteamento (`src/index.ts`, `roleRoutes`).
2. Integração de login/register + `auth/profile`, garantindo cookies e estados (prioridade global).
3. Agenda paciente: build `dashboardStore` sections (appointments/exams/prescriptions) e `POST /appointments` com RN.
4. Slots/agendamento geral e recepção (filtros, Cancelamento, Reagendamento + CloudWalk mock).
5. Dashboards profissionais (availability, commissions, filters) e admin (users, reports).
6. Exames/prescrições e páginas complementares (pep, labs).
7. Documentação e testes finais (cobertura 80%, flows de erro).

### Status da Sequência

- [x] Etapa 1 (API/Stores/roleRoutes) concluída conforme descrito no PROGRESS-backend-integration.md (autenticação, authStore, authReadyPromise, roleRoutes).
- [x] Etapas 2-3 (login/register, dashboardStore, agendamentos com validações RN) implementadas nos serviços/pages mencionados e registradas durante as sessões 4-6 no PROGRESS.
- [x] Etapas 4-6 (slots, dashboards profissionais/admin, exames/prescrições) entregues com `doctorDashboard`, `receptionDashboard`, `adminDashboard`, `usersPage`, `examsService`, `prescriptionsService`, `scheduleAppointment`, e os modals/painéis descritos.
- [ ] Etapa 7 (documentação final, testes automáticos e QA) está em andamento com a documentação de CSS/QA e a planilha de testes em `REFATORACAO_CSS.md` / `docs/*.md`, faltando apenas a execução completa dos testes em lote.

## 5. Coordenação com o Time

- **Equipe Backend:** deve fornecer o host (`CLINIC_API_HOST`), `PAYMENT_MOCK_KEY`, e garantir que `Set-Cookie: token` esteja presente em respostas auth.
- **Equipe Front:** implementar stores, services e componentes que consomem endpoints listados, apoiar com toasts e states de carregamento/erro.
- **QA/DevOps:** revisar as regras RN-01 a RN-28 antes de liberar cada feature, validar fluxos manualmente e garantir env prod com `CLINIC_API_HOST` via `DefinePlugin`.

## 6. Referências e Checklist de Verificação

- `docs/DOC_API_ROTAS.md` (endpoints + exemplos JSON)
- `docs/contrato-de-integracao.md` (headers, error handling, cache)
- `docs/HANDOFF.md` (prioridades, auth overlay, RN pendentes)
- `docs/paginas-para-fluxos.md` (mapa páginas ↔ endpoints)
- `docs/fluto-de-dados-e-estados.md` (estado UI + RN de agendamento)
- `docs/MedClinic MVP Kanban de Tarefas Atômicas.md` (priorização por sprints).

## 7. Passo 3 obrigatório para futuras IAs

- Todas as IAs que abrirem este plano devem seguir o **Passo 3** descrito em “Sequência Sugerida”:
  1. Priorize a agenda paciente e as stores (`dashboardStore`) conectadas aos endpoints de appointments, exams e prescriptions.
  2. Garanta que o `POST /appointments` incorpore as validações RN-01 a RN-05 e exiba as mensagens de erro padronizadas (`SLOT_NOT_AVAILABLE`, `DUPLICATE_APPOINTMENT`, etc.).
  3. Documente os estados de loading/empty/error antes de avançar para outros módulos.

> Obs: este passo deve ser lido e respeitado antes de qualquer implementação futura; somente após receber aprovação para avançar além do Passo 1 deve-se executar os próximos passos definidos nesta sequência.

### Checklist final antes de integrar cada feature

- [x] APIs consumidas com `apiService.request` (incluindo `credentials`/headers).
- [x] Respostas 401/403 tratadas, `authStore` resetado e redirecionado à login.
- [x] Stores (auth, dashboard, ui) atualizados com dados reais e adaptadores.
- [x] RN de validação aplicados no frontend (unidades RN-01 a RN-05 e validações de cadastro).
- [x] Estados de Loading, Success, Empty, Error documentados e exibidos.
- [x] Toasts e overlays (`uiStore`) exibem mensagens do backend.
- [x] CSS refatorado para tokens quando apropriado (overlay, toasts, layout).
- [x] Documentação atualizada (incluindo `plan2.md` como referência) e fluxo mapeado para QA.

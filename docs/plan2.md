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

- **Endpoints principais** (Handoff + contrato): `/auth/login`, `/auth/profile`, `/auth/logout`, `/auth/register`.
- **Tarefas:**
  - Atualizar `apiService` com `Accept: application/json`, `Content-Type`, toasts para `error.message`, sink de erros 401/403 redirecionando para `/pages/login.html`.
  - Garantir `authStore.refreshSession()` chama `/auth/profile` logo após login e antes de liberar rotas (entrypoint `src/index.ts`).
  - Normalizar payloads com Adapter (ex: `authPayload2UserSession`) e persistir cookie HttpOnly em `apiService`.
  - Validar formularios de login/cadastro no frontend com regras de senha/CPF/email do contrato e `docs/ANALISE_PROJETO_MEDCLINIC.md` (RN-05, RN-09 etc.).
  - Equipar `uiStore` para toasts e overlays (`#auth-blocker`) conforme `docs/HANDOFF.md`.

### 3.2 Dashboards Paciente e Roles (Equipe Dashboard/UI)

- **Fluxos de dados baseados em papel/rota:**
  - **Paciente (`patient-dashboard.html` / `index.html`):**
    - `GET /auth/profile` para user e professional_details quando aplicável.
    - `GET /appointments?patient_id={id}&upcoming=true` para próximos agendamentos.
    - `GET /appointments?patient_id={id}&status=cancelled_by_patient` para histórico quando necessário.
    - `GET /exams?patient_id={id}` e `GET /prescriptions?patient_id={id}` para cards clínicos.
    - `GET /professionals` (com filtros `specialty`, `name`) para sugerir novos médicos.
    - `POST /appointments`, `POST /appointments/:id/cancel`, `POST /appointments/:id/reschedule` para fluxo de reagendamento/cancelamento.
  - **Profissional (`doctor-dashboard.html`):**
    - `GET /auth/profile` (contém professional_details, specialty, price).
    - `GET /appointments?professional_id={id}&upcoming=true` para agenda.
    - `GET /professionals/{id}/availability` para mostrar slots (RN-01, RN-04).
    - `GET /professionals/{id}/commissions` para painel financeiro.
  - **Recepção (`reception-dashboard.html`, `agenda.html`):**
    - `GET /appointments?status=scheduled` (ou demais statuses) com paginação e filtros (`professional_id`, `patient_id`, `date`).
    - `GET /professionals` + `GET /professionals/{id}/availability` para seleção de slots.
    - `POST /appointments`, `DELETE /appointments/:id`, `POST /appointments/:id/reschedule` para criar/modificar atendimentos.
    - `GET /appointments/:id` quando precisar detalhes ampliados.
  - **Admin (`admin-dashboard.html`, `users.html`, `financial.html`):**
    - `GET /users` e `GET /users/:id` (with role filters) para gerenciamento.
    - `PUT /users/:id`, `DELETE /users/:id` com RBAC e erros 403/409.
    - `GET /reports/dashboard`, `GET /reports/financial`, `GET /reports/commissions` e `GET /appointments` para indicadores.
    - `GET /professionals` para lista e filtros administrativos.
- **Tarefas:**
  - Preencher `dashboardStore` com sections (meus agendamentos, exames, prescrições) e lidar com loaders/empty/error states; cada role deve renderizar apenas os widgets permitidos.
  - Mapear RN-01/02/03/04 no fluxo paciente antes de chamar `POST /appointments`, exibindo mensagens específicas (`SLOT_NOT_AVAILABLE`, `DUPLICATE_APPOINTMENT`, `INSUFFICIENT_NOTICE`, `NEW_SLOT_NOT_AVAILABLE`).
  - Criar resumo de pagamento com o `payment_required` do POST (CloudWalk mock) e permitir retry caso o status seja `failed`.
  - Garantir `roleRoutes` (src/config/roleRoutes.ts) respeita `UserSession.role`, redireciona pacientes, profissionais e admins para suas respectivas dashboards antes de renderizar qualquer página protegida.

### 3.3 Slots / Agendamentos / Recepção (Equipe Scheduling)

- **Endpoints e payloads (checar)**
  - [x] `GET /professionals?specialty=&name=&page=&pageSize=` – lista pública de profissionais com `specialty`, `consultation_price`, `registration_number` para preencher dropdowns/tiles.
  - [x] `GET /professionals/{id}/availability?startDate=&endDate=&days_ahead=` – recupera slots com flag `is_available`; o frontend filtra o retorno para só exibir horários futuros e mostra `reason` + toasts quando apropriado.
  - [x] `POST /appointments` – payload `{ patient_id, professional_id, date, time, type, price }`; resposta é usada para toasts e atualização imediata da tela.
  - [ ] `GET /appointments?status=&professional_id=&patient_id=&date=&upcoming=true&page=&pageSize=` – agendas para recepção/pacientes com filtros, paginação e deduplicação (keeper de RN-04 não implementado).
  - [ ] `DELETE /appointments/{id}` – cancelamentos com corpo opcional `reason`, resposta inclui `refund` (regras 24h/70%).
  - [ ] `POST /appointments/{id}/reschedule` – payload `{ new_date, new_time }`, valida RN-01/02/03 e responde com novo `appointment`.
  - [ ] `GET /appointments/{id}` – detalhamento para recepção e exibição de notas/pagamentos.
- **Tarefas detalhadas (status)**
  - [ ] Criar helpers de cache simples (`professionalsListCache`/`slotsCache`) para reduzir chamadas repetidas ao navegar entre datas.
  - [x] Garantir que `apiService` expose métodos `getProfessionals`, `getAvailability`, `createAppointment`, `listAppointments` com mapeamento de erros (RN-specific mapping ainda pendente).
  - [ ] Aplicar RN-01 a RN-05 com toasts específicos (`SLOT_NOT_AVAILABLE`, `INSUFFICIENT_NOTICE`, `DUPLICATE_APPOINTMENT`, `payment mock`). Hoje há filtragem de datas futuras, mas sem mensagens dedicadas de backend.
  - [x] Implementar loaders/empty/error states nos cards e no painel de disponibilidades (com skeletons e mensagens de fallback).
  - [ ] Oferecer filtros por status (`scheduled`, `confirmed`, `cancelled`), `professional_id`, `date` e `upcoming` via `GET /appointments`, mantendo os filtros no store.
  - [x] Quando `payment_required` é recebido, exibir modal de confirmação com valor, botão de pagamento e comportamentos de retry baseados no status retornado.
  - [ ] Após `cancel` ou `reschedule`, revalidar `GET /professionals/{id}/availability` e notificar o usuário da atualização do calendário.

### 3.4 Profissionais / Disponibilidade / Comissões (Equipe Doctor)

- **Endpoints e payloads críticos**:
  - `GET /professionals/{id}/availability?startDate=&endDate=&days_ahead=` – retorna `slots` com `time`, `available`, `duration_minutes`, `reason`; RN-01/04 dizem por ex. `available=false` deve ser mostrado como bloqueado no calendário e exibir `reason` como tooltip.
  - `POST /professionals/{id}/availability` – body `availabilities[]` com `day_of_week`, `start_time`, `end_time`, `is_active`. Feedback `201` com os horários criados ou `409 OVERLAPPING_TIMES`. `uiStore` deve mostrar toasts quando a sobreposição acontecer.
  - `GET /professionals/{id}/commissions?month=&year=&status=` – retorna `summary` (pending, paid, total) e `details` (appointment_id, amount, status). Aplicar 60% do líquido para cálculos visuais, mas usar o summary oficial para confiabilidade.
  - `GET /appointments?professional_id={id}&status=scheduled&upcoming=true` – agenda com filtros; paginar se necessário.
  - `POST /appointments/{id}/reschedule` e `DELETE /appointments/{id}` também devem atualizar a disponibilidade e comissões refletidas.
- **Tarefas detalhadas:**
  - Consumir `professional_details` do `/auth/profile` para preencher perfil (especialidade, registro, preço, comissão) e usar `roleRoutes` para garantir apenas médicos vejam o dashboard.
  - Renderizar calendar view com slots (`available` vs `booked`), tooltips baseados em `reason` e cores que comunicam RN-01 (disponibilidade) e RN-04 (sem duplicidade). Sincronizar com `dashboardStore`/`appointmentStore`.
  - Implementar modal/form de “Cadastrar disponibilidade” que chama o POST e converte a resposta em novos slots, tratando `OVERLAPPING_TIMES` (toast + highlight em inputs) e `is_active` toggle.
  - Criar painel de comissões baseado em `GET /professionals/{id}/commissions`, mostrando resumo (pending, paid, total) e detalhes (appointment_id, amount, status, timestamps). Calcular visualmente 60% do líquido, mas exibir o valor oficial do backend para transparência.
  - Atualizar a mesma interface quando `POST /appointments/{id}/reschedule` ou `DELETE /appointments/{id}` muda os slots pagos e comissões pendentes, mantendo `dashboardStore` sincronizado e exibindo toasts confirmando alterações.

### 3.5 Exames & Prescrições (Equipe Clinical)

- **Endpoints e fluxos clínicos**:
  - `GET /exams?patient_id={id}` – retorna lista de exames relacionados ao paciente, com `status`, `exam_name`, `result`, `created_at`. Use response para preencher cards no dashboard e `exams.html`.
  - `GET /exams/:id` – detalhes completos incluindo `clinical_indication`, `result` e `status` para modais de visualização.
  - `POST /exams` – body `{ appointment_id, patient_id, exam_name, exam_price, clinical_indication }`. Apenas health_professional pode chamar; backend responde com `201` e exam criado.
  - `GET /prescriptions?patient_id={id}` – lista prescrições ativas, com `medication_name`, `created_at`, `quantity`, `dosage`, `notes`.
  - `GET /prescriptions/:id` – detalhe com histórico de revisões/updates.
  - `POST /prescriptions` – body `{ appointment_id, patient_id, medication_name, dosage, quantity }`; RBAC restrito a profissionais.
- **Tarefas detalhadas:**
  - Criar `clinicalStore` (ou integrar ao dashboardStore) para manter exames/prescrições e disponibilizar estados `loading`, `success`, `error`, `empty`, com retry e CTA para abrir modal `schedule exam` ou `new prescription`.
  - Nos componentes (`exams.html`, `prescription.html`, `pep.html`), renderizar cards que mostram status (ex: `pending`, `released`, `in progress`) e permitir o paciente acessar detalhes do exame/prescrição com `GET /exams/:id` e `GET /prescriptions/:id`.
  - Validar RBAC na UI: pacientes veem apenas listagem/links, profissionais veem botões para `POST /exams` e `POST /prescriptions`, admins podem visualizar relatórios completos.
  - Ao criar um exame ou prescrição, usar `uiStore` para toasts (success/erro) e limpar formularios; mostrar loaders/disabling do botão durante submissão.
  - Registrar erros HTTP relevantes (400, 403, 409) e mapear `error.code` para mensagens legíveis (`EXAM_NOT_FOUND`, `FORBIDDEN`, etc.) conforme `docs/DOC_API_ROTAS.md`.

### 3.6 Admin / Users / Reports (Equipe Admin)

- **Endpoints e responsabilidades**:
  - `GET /users?role=&search=&page=&pageSize=` – retorna lista paginada de usuários com filtros por role; requisitado por `admin-dashboard.html` e `users.html`.
  - `GET /users/:id` – recupera detalhes para modals de edição, incluindo `professional_details` quando aplicável.
  - `PUT /users/:id` – atualiza nome/email/telefone (paciente) ou campos adicionais para admin; deve obedecer RBAC e retornar `403 FORBIDDEN` ou `409 EMAIL_ALREADY_EXISTS` se violado.
  - `DELETE /users/:id` – desativa um usuário (soft delete); backend pode responder `409 USER_HAS_PENDING_RECORDS`. UI deve bloquear ações caso existam dependências.
  - `GET /reports/dashboard`, `GET /reports/financial`, `GET /reports/commissions` – exibem KPIs, totais e tendências financeiras.
  - `GET /appointments?status=&professional_id=&patient_id=` – usado por admins para visão completa e também por `financial.html` (status `paid`) e `reports` para dados complementares.
  - `GET /professionals` (administrativo) – exibe filtros e indicadores de disponibilidade/comissão.
- **Tarefas detalhadas:**
  - Garantir todos os requests admin passam por `apiService` com `authStore.session.role` verificando `clinic_admin` ou `system_admin` antes mesmo de renderizar `admin-dashboard` (roleRoutes + guardas). Bloquear UI se role inadequado.
  - Implementar datagrids com filtros (role, status, search, page) que utilizam `GET /users` e `GET /appointments` com `pagination`, mantendo o state nos stores para preservar filtros ao navegar.
  - Criar forms de edição/remoção (PUT/DELETE) com validações e mensagens de erro. Responses `403`, `409` e `400` devem alimentar `uiStore` toasts e logs para depuração.
  - Sincronizar relatórios (`GET /reports/*`) com painéis e combos (por ex: filtros de data) e exibir resumo `summary`, `transactions`, `commission` com badges e tooltips.
  - Adicionar página ou seção `financial.html` com `GET /appointments?status=paid`, `GET /reports/financial`, `GET /professionals` para mostrar totais por período e permitir export (CSV/JSON) via buttons.

### 3.7 Infraestruturas Transversais

- **Tasks de suporte**:
  - **CSS / Tokens:** implementar `css/variables.css` e integrar em `css/global.css`, definindo tokens (`--color-primary`, `--spacing-md`, etc.) conforme `REFATORACAO_CSS.md`. Refatorar overlay `#auth-blocker`, scrollbars e toasts para usar tokens, mantendo o design consistente.
  - **Documentação e QA:** registrar fluxos RN-01 a RN-28, estados (`loading`, `success`, `empty`, `error`), e abrir diagramas (fluxogramas/sequências) quando necessário. Atualizar o README/PROGRESS com mudanças e referenciar `plan2.md` como fonte de verdade.
  - **Testes e qualidade:** planejar testes manuais (checklists) para cada fluxo crítico e preparar suites automatizadas (Mocha/Chai para backend, possíveis testes end-to-end). Monitorar coverage >80% e atualizar `PROGRESS-backend-integration.md`.
  - **Configurações de build:** garantir o `webpack.config.js` injeta `CLINIC_API_HOST`/`PAYMENT_MOCK_KEY` via `DefinePlugin`, habilita SourceMaps, e que `manifest.json` + `sw.js` estão alinhados para eventual PWA.
  - **Alertas e monitoramento:** integrar `uiStore` toasts com eventos de erro e `apiService.handleError`; logar `error.code`, `statusCode`, e permitir que `uiStore` produza banners globais (ex: “Serviço indisponível”).
  - Documentar fluxos com RN e states para QA, incluindo sequence diagrams se necessário (para `plan2` ser referência).
  - Implementar testes manuais e automáticos (mocha? front?). Priorizar 80% coverage backend per Kanban.

## 4. Sequência Sugerida (baseada no Kanban + contratos)

1. Upgrades no `apiService`, `authStore` e roteamento (`src/index.ts`, `roleRoutes`).
2. Integração de login/register + `auth/profile`, garantindo cookies e estados (prioridade global).
3. Agenda paciente: build `dashboardStore` sections (appointments/exams/prescriptions) e `POST /appointments` com RN.
4. Slots/agendamento geral e recepção (filtros, Cancelamento, Reagendamento + CloudWalk mock).
5. Dashboards profissionais (availability, commissions, filters) e admin (users, reports).
6. Exames/prescrições e páginas complementares (pep, labs).
7. Documentação e testes finais (cobertura 80%, flows de erro).

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

- [ ] APIs consumidas com `apiService.request` (incluindo `credentials`/headers).
- [ ] Respostas 401/403 tratadas, `authStore` resetado e redirecionado à login.
- [ ] Stores (auth, dashboard, ui) atualizados com dados reais e adaptadores.
- [ ] RN de validação aplicados no frontend (unidades RN-01 a RN-05 e validações de cadastro).
- [ ] Estados de Loading, Success, Empty, Error documentados e exibidos.
- [ ] Toasts e overlays (`uiStore`) exibem mensagens do backend.
- [ ] CSS refatorado para tokens quando apropriado (overlay, toasts, layout).
- [ ] Documentação atualizada (incluindo `plan2.md` como referência) e fluxo mapeado para QA.

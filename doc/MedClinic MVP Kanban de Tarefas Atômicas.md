# 🎯 MedClinic MVP - Kanban de Tarefas Atômicas

**Status Geral:** 🔴 A Começar | **Data:** 24 Jan 2026 | **Total:** 127 tarefas

---

## 📋 COLUNA 1: TODO (A Fazer)

### 🔐 FASE 1: FUNDAÇÃO & BANCO DE DADOS (12 tarefas)

#### Sprint 1.1: Setup Inicial
- [ ] **1.1.1** Configurar repositório Git com .gitignore (Node + TypeScript)
- [ ] **1.1.2** Instalar dependências: express, typescript, sqlite3, jsonwebtoken, bcrypt
- [ ] **1.1.3** Configurar tsconfig.json com strict mode
- [ ] **1.1.4** Criar arquivo package.json com scripts (dev, build, test, seed)
- [ ] **1.1.5** Estruturar pastas do projeto (src/, tests/, frontend_src/)

#### Sprint 1.2: Banco de Dados
- [ ] **1.2.1** Criar `schema.sql` com tabela `users` (id, name, email, password_hash, role, cpf, phone, created_at, deleted_at)
- [ ] **1.2.2** Criar tabela `professional_details` (id, user_id, specialty, registration_number, council, consultation_price, commission_percentage)
- [ ] **1.2.3** Criar tabela `professional_availabilities` (id, professional_id, day_of_week, start_time, end_time, is_active)
- [ ] **1.2.4** Criar tabela `appointments` (id, patient_id, professional_id, date, time, duration_minutes, type, status, payment_status, price, room_number, notes, created_at, updated_at)
- [ ] **1.2.5** Criar tabela `transaction_logs` (id, appointment_id, amount_gross, mdr_amount, amount_net, status, created_at)
- [ ] **1.2.6** Criar tabela `commission_splits` (id, transaction_id, professional_id, clinic_id, system_id, amount, status)
- [ ] **1.2.7** Implementar indexes em `users(email)`, `appointments(patient_id, professional_id, date)`, `professional_availabilities(professional_id)`

#### Sprint 1.3: Configuração DB
- [ ] **1.3.1** Criar `config/database.ts` com Singleton pattern para SQLite3
- [ ] **1.3.2** Implementar `database/seed.ts` com 1 system_admin, 1 clinic_admin, 1 receptionist, 3 health_professionals, 5 patients
- [ ] **1.3.3** Criar script npm para rodar migrations e seed no startup
- [ ] **1.3.4** Validar integridade referencial e constraints

---

### 🔐 FASE 2: AUTENTICAÇÃO (15 tarefas)

#### Sprint 2.1: Serviço de Autenticação
- [ ] **2.1.1** Criar `services/AuthService.ts` com método `registerPatient(name, email, password, cpf, phone)`
- [ ] **2.1.2** Implementar hash bcrypt para passwords (10 rounds)
- [ ] **2.1.3** Implementar validação: email único no banco
- [ ] **2.1.4** Implementar validação: CPF formato XXX.XXX.XXX-XX (regex)
- [ ] **2.1.5** Implementar validação: senha 8+, 1 maiúscula, 1 minúscula, 1 número
- [ ] **2.1.6** Criar método `login(email, password)` que retorna JWT
- [ ] **2.1.7** Implementar JWT com expiração 24h, payload {id, email, role, iat, exp}

#### Sprint 2.2: Controllers & Rotas
- [ ] **2.2.1** Criar `controllers/AuthController.ts` com método `register`
- [ ] **2.2.2** Criar rota `POST /api/v1/:clinic_id/auth/register` com validações
- [ ] **2.2.3** Criar `controllers/AuthController.ts` método `login`
- [ ] **2.2.4** Criar rota `POST /api/v1/:clinic_id/auth/login` (set HttpOnly Cookie)
- [ ] **2.2.5** Criar rota `GET /api/v1/:clinic_id/auth/profile` (requer JWT)
- [ ] **2.2.6** Criar rota `POST /api/v1/:clinic_id/auth/logout` (limpa cookie)

#### Sprint 2.3: Middleware & Segurança
- [ ] **2.3.1** Criar `middlewares/authMiddleware.ts` (verificar JWT + validar expiração)
- [ ] **2.3.2** Implementar middleware de role-based access (RBAC)
- [ ] **2.3.3** Configurar CORS para http://localhost:3001 apenas
- [ ] **2.3.4** Configurar headers de segurança (helmet)

#### Sprint 2.4: Testes de Autenticação
- [ ] **2.4.1** Teste: registrar paciente válido retorna 201
- [ ] **2.4.2** Teste: email duplicado retorna 409 CONFLICT
- [ ] **2.4.3** Teste: senha fraca retorna 400
- [ ] **2.4.4** Teste: CPF inválido retorna 400
- [ ] **2.4.5** Teste: login com credenciais corretas retorna 200 + cookie

---

### 👥 FASE 3: USUÁRIOS (16 tarefas)

#### Sprint 3.1: Repository & Service
- [ ] **3.1.1** Criar `repositories/UserRepository.ts` com CRUD básico
- [ ] **3.1.2** Criar `services/UserService.ts` com lógica de negócio
- [ ] **3.1.3** Implementar `getUserById(id)` com professional_details se médico
- [ ] **3.1.4** Implementar `listUsers(filters, page, pageSize)` com paginação

#### Sprint 3.2: Controllers & Rotas
- [ ] **3.2.1** Criar `controllers/UserController.ts`
- [ ] **3.2.2** Criar rota `GET /api/v1/:clinic_id/users` (clinic_admin, receptionist, system_admin apenas)
- [ ] **3.2.3** Implementar filtros: role, search (name), page, pageSize
- [ ] **3.2.4** Criar rota `GET /api/v1/:clinic_id/users/:id` (próprio ou admin)
- [ ] **3.2.5** Criar rota `PUT /api/v1/:clinic_id/users/:id` (próprio: nome/email/telefone, admin: tudo exceto role/password)
- [ ] **3.2.6** Criar rota `DELETE /api/v1/:clinic_id/users/:id` (soft delete, apenas system_admin + clinic_admin)

#### Sprint 3.3: Validações & Autorização
- [ ] **3.3.1** Implementar verificação de permissão: paciente não acessa dados de outro
- [ ] **3.3.2** Implementar verificação: recepcionista não pode deletar usuário
- [ ] **3.3.3** Validar integridade referencial em soft delete (consultas pendentes)
- [ ] **3.3.4** Implementar error response 403 FORBIDDEN para acesso negado
- [ ] **3.3.5** Implementar error response 404 NOT_FOUND para usuário inexistente

#### Sprint 3.4: Testes de Usuários
- [ ] **3.4.1** Teste: GET /users retorna lista com paginação
- [ ] **3.4.2** Teste: GET /users?role=health_professional filtra corretamente
- [ ] **3.4.3** Teste: paciente não vê GET /users (403)
- [ ] **3.4.4** Teste: PUT /users/:id próprio permite (nome/email)
- [ ] **3.4.5** Teste: DELETE /users/:id sem permissão retorna 403
- [ ] **3.4.6** Teste: soft delete mascara deleted_at

---

### 👨‍⚕️ FASE 4: PROFISSIONAIS & DISPONIBILIDADES (18 tarefas)

#### Sprint 4.1: Repository & Service
- [ ] **4.1.1** Criar `repositories/ProfessionalRepository.ts`
- [ ] **4.1.2** Criar `repositories/AvailabilityRepository.ts`
- [ ] **4.1.3** Criar `services/ProfessionalService.ts`
- [ ] **4.1.4** Implementar método `listProfessionals(filters, pagination)` público

#### Sprint 4.2: Rotas - Listagem
- [ ] **4.2.1** Criar `controllers/ProfessionalController.ts`
- [ ] **4.2.2** Criar rota `GET /api/v1/:clinic_id/professionals` (pública, sem autenticação)
- [ ] **4.2.3** Implementar filtros: specialty, name, page, pageSize
- [ ] **4.2.4** Retornar: id, name, specialty, consultation_price

#### Sprint 4.3: Rotas - Disponibilidade
- [ ] **4.3.1** Criar rota `GET /api/v1/:clinic_id/professionals/:id/availability` (público)
- [ ] **4.3.2** Implementar query params: days_ahead (default 7, max 90)
- [ ] **4.3.3** Retornar slots de 50min em formato: [{date, time, is_available}, ...]
- [ ] **4.3.4** Implementar lógica: descontar agendamentos já feitos
- [ ] **4.3.5** Criar rota `POST /api/v1/:clinic_id/professionals/:id/availability` (apenas profissional + admin)
- [ ] **4.3.6** Implementar cadastro de horários (day_of_week 0-6, start_time, end_time)
- [ ] **4.3.7** Validar: start_time < end_time
- [ ] **4.3.8** Validar: sem sobreposição com horários existentes

#### Sprint 4.4: Comissões
- [ ] **4.4.1** Criar rota `GET /api/v1/:clinic_id/professionals/:id/commissions` (médico vê suas, admin qualquer)
- [ ] **4.4.2** Implementar query params: month, year, status (pending|paid)
- [ ] **4.4.3** Retornar summary: pending, paid, total
- [ ] **4.4.4** Retornar details: appointment_id, amount, status, created_at, paid_at
- [ ] **4.4.5** Implementar cálculo: 60% do líquido (amount_net * 0.60)

#### Sprint 4.5: Testes de Profissionais
- [ ] **4.5.1** Teste: GET /professionals retorna lista pública
- [ ] **4.5.2** Teste: GET /professionals?specialty=cardiologia filtra
- [ ] **4.5.3** Teste: GET /professionals/:id/availability retorna 7 dias default
- [ ] **4.5.4** Teste: POST /professionals/:id/availability rejeita horários sobrepostos (409)
- [ ] **4.5.5** Teste: GET /professionals/:id/commissions sem permissão retorna 403
- [ ] **4.5.6** Teste: Comissão calcula 60% corretamente

---

### 📅 FASE 5: AGENDAMENTOS (35 tarefas)

#### Sprint 5.1: Repository & Service Base
- [ ] **5.1.1** Criar `repositories/AppointmentRepository.ts` com CRUD
- [ ] **5.1.2** Criar `services/AppointmentService.ts`
- [ ] **5.1.3** Implementar `listAppointments(filters, pagination)` com RBAC
- [ ] **5.1.4** Implementar `getAppointmentById(id)` com RBAC

#### Sprint 5.2: Rotas - Listagem & Detalhes
- [ ] **5.2.1** Criar `controllers/AppointmentController.ts`
- [ ] **5.2.2** Criar rota `GET /api/v1/:clinic_id/appointments` (RBAC: paciente vê seus, médico vê seus, recepcionista todos, admin todos)
- [ ] **5.2.3** Implementar filtros: status, professional_id, patient_id, date, upcoming (boolean)
- [ ] **5.2.4** Implementar paginação: page, pageSize
- [ ] **5.2.5** Criar rota `GET /api/v1/:clinic_id/appointments/:id` (RBAC)

#### Sprint 5.3: Validações de Negócio (RN)
- [ ] **5.3.1** Implementar RN-01: horário deve estar em `professional_availabilities`
- [ ] **5.3.2** Implementar RN-02: antecedência mínima 2h para presencial
- [ ] **5.3.3** Implementar RN-03: antecedência máxima 90 dias
- [ ] **5.3.4** Implementar RN-04: sem 2 consultas com mesmo médico no mesmo dia
- [ ] **5.3.5** Validar: data não pode ser no passado
- [ ] **5.3.6** Validar: profissional deve existir
- [ ] **5.3.7** Validar: paciente deve existir

#### Sprint 5.4: Integração com Pagamento Mock
- [ ] **5.4.1** Criar `services/PaymentMockService.ts`
- [ ] **5.4.2** Implementar `processPayment(appointment)`: 80% sucesso, 20% falha (random)
- [ ] **5.4.3** Calcular: amount_gross, mdr (3.79%), amount_net
- [ ] **5.4.4** Criar split: 60% profissional, 35% clínica, 5% sistema
- [ ] **5.4.5** Salvar em `transaction_logs` e `commission_splits`
- [ ] **5.4.6** Retornar invoice na response (mockado)

#### Sprint 5.5: Criação de Agendamento
- [ ] **5.5.1** Implementar rota `POST /api/v1/:clinic_id/appointments` (paciente + recepcionista)
- [ ] **5.5.2** Body: patient_id, professional_id, date, time, type (apenas "presencial" MVP)
- [ ] **5.5.3** Executar todas as RN-01 a RN-07
- [ ] **5.5.4** Criar appointment com status "scheduled"
- [ ] **5.5.5** Chamar PaymentMockService
- [ ] **5.5.6** Setar appointment.payment_status baseado em resultado
- [ ] **5.5.7** Retornar 201 Created com dados do agendamento + invoice

#### Sprint 5.6: Cancelamento
- [ ] **5.6.1** Implementar rota `DELETE /api/v1/:clinic_id/appointments/:id` (paciente seu, recepcionista, admin)
- [ ] **5.6.2** Lógica: >24h = 100% reembolso, <24h = 70% reembolso
- [ ] **5.6.3** Atualizar appointment.status = "cancelled_by_patient" ou "cancelled_by_clinic"
- [ ] **5.6.4** Retornar response com aviso de reembolso

#### Sprint 5.7: Reagendamento
- [ ] **5.7.1** Implementar rota `POST /api/v1/:clinic_id/appointments/:id/reschedule` (paciente seu, recepcionista, admin)
- [ ] **5.7.2** Body: date, time
- [ ] **5.7.3** Validar novo slot com RN-01, 02, 03
- [ ] **5.7.4** SEM taxa para reagendamento (MVP apenas)
- [ ] **5.7.5** Manter payment_status do agendamento original

#### Sprint 5.8: Testes de Agendamentos (Parte 1)
- [ ] **5.8.1** Teste: POST /appointments retorna 201 com payment bem-sucedido
- [ ] **5.8.2** Teste: POST /appointments retorna 400 horário não disponível (RN-01)
- [ ] **5.8.3** Teste: POST /appointments retorna 400 antecedência <2h (RN-02)
- [ ] **5.8.4** Teste: POST /appointments retorna 400 data >90 dias (RN-03)
- [ ] **5.8.5** Teste: POST /appointments retorna 409 duplicação mesmo dia (RN-04)
- [ ] **5.8.6** Teste: GET /appointments filtra por status
- [ ] **5.8.7** Teste: GET /appointments?upcoming=true retorna apenas futuras

#### Sprint 5.9: Testes de Agendamentos (Parte 2)
- [ ] **5.8.8** Teste: DELETE /appointments >24h = 100% reembolso
- [ ] **5.8.9** Teste: DELETE /appointments <24h = 70% reembolso
- [ ] **5.8.10** Teste: Paciente não deleta agendamento de outro (403)
- [ ] **5.8.11** Teste: POST /appointments/:id/reschedule muda data
- [ ] **5.8.12** Teste: Reagendamento rejeita horário duplicado (RN-04)
- [ ] **5.8.13** Teste: Payment mock: 80% dos testes devem passar (determinístico ou stub)

---

### 🧪 FASE 6: EXAMES & PRESCRIÇÕES (Simplificado) (12 tarefas)

#### Sprint 6.1: Exames
- [ ] **6.1.1** Criar tabela `exams` (id, patient_id, professional_id, exam_name, status, created_at)
- [ ] **6.1.2** Criar `repositories/ExamRepository.ts`
- [ ] **6.1.3** Criar `services/ExamService.ts`
- [ ] **6.1.4** Criar rota `GET /api/v1/:clinic_id/exams` (paciente seus, médico que solicitou, lab_tech todos, admin todos)
- [ ] **6.1.5** Criar rota `GET /api/v1/:clinic_id/exams/:id` (detalhes)
- [ ] **6.1.6** Criar rota `POST /api/v1/:clinic_id/exams` (apenas médico solicita, campo: exam_name texto livre)

#### Sprint 6.2: Prescrições
- [ ] **6.2.1** Criar tabela `prescriptions` (id, patient_id, professional_id, medication_name, created_at)
- [ ] **6.2.2** Criar `repositories/PrescriptionRepository.ts`
- [ ] **6.2.3** Criar `services/PrescriptionService.ts`
- [ ] **6.2.4** Criar rota `GET /api/v1/:clinic_id/prescriptions` (paciente suas, médico criadas por ele)
- [ ] **6.2.5** Criar rota `POST /api/v1/:clinic_id/prescriptions` (apenas médico cria, campo: medication_name texto livre)
- [ ] **6.2.6** Testes básicos: criar, listar, validar RBAC

---

### 🌐 FASE 7: MIDDLEWARE & HANDLERS (6 tarefas)

#### Sprint 7.1: Error Handler Global
- [ ] **7.1.1** Criar `middlewares/errorHandler.ts` com tratamento genérico
- [ ] **7.1.2** Implementar respostas padronizadas (success, error com code + message)
- [ ] **7.1.3** Logar erros em console + arquivo (opcional)
- [ ] **7.1.4** Retornar status HTTP correto baseado em tipo de erro

#### Sprint 7.2: Validação Global
- [ ] **7.2.1** Criar `utils/validators.ts` com funções: isValidEmail, isValidCPF, isValidPassword, isValidPhone
- [ ] **7.2.2** Reutilizar validators em todos controllers

---

### 🎨 FASE 8: FRONTEND VANILLA (22 tarefas)

#### Sprint 8.1: Setup Inicial
- [ ] **8.1.1** Criar estrutura `frontend_src/index.html` (boilerplate básico)
- [ ] **8.1.2** Criar `frontend_src/main.ts` (entry point)
- [ ] **8.1.3** Criar `frontend_src/styles/global.css` (reset + variáveis CSS)
- [ ] **8.1.4** Configurar webpack/vite para compilar TypeScript

#### Sprint 8.2: API Service
- [ ] **8.2.1** Criar `frontend_src/types/api.ts` (interfaces TypeScript)
- [ ] **8.2.2** Criar `frontend_src/services/api.ts` (fetch helper com cookie support)
- [ ] **8.2.3** Implementar métodos: GET, POST, PUT, DELETE
- [ ] **8.2.4** Tratar erros e retornar typed responses

#### Sprint 8.3: Componentes Reutilizáveis
- [ ] **8.3.1** Criar `frontend_src/components/Modal.ts` (abrir/fechar)
- [ ] **8.3.2** Criar `frontend_src/components/Toast.ts` (notificações sucesso/erro)
- [ ] **8.3.3** Criar `frontend_src/components/Form.ts` (validação client-side + submit)
- [ ] **8.3.4** Criar `frontend_src/styles/components.css` (styling)

#### Sprint 8.4: Páginas - Autenticação
- [ ] **8.4.1** Criar `frontend_src/pages/Login.ts` (form email + password)
- [ ] **8.4.2** Implementar validação client-side (email, password)
- [ ] **8.4.3** Criar feedback visual (loading, erro, sucesso)
- [ ] **8.4.4** Criar `frontend_src/pages/RegisterPatient.ts` (form name, email, password, cpf, phone)
- [ ] **8.4.5** Implementar validação: CPF formato, senha força
- [ ] **8.4.6** Redirecionar para Login após sucesso

#### Sprint 8.5: Dashboard Paciente
- [ ] **8.5.1** Criar `frontend_src/pages/DashboardPatient.ts` (layout básico)
- [ ] **8.5.2** Seção: "Meus Agendamentos" (listar, filtros por status)
- [ ] **8.5.3** Seção: "Agendar Consulta" (selecionar profissional, data, hora)
- [ ] **8.5.4** Modal de confirmação com preço + detalhes
- [ ] **8.5.5** Ação: Cancelar agendamento (com confirmação)
- [ ] **8.5.6** Ação: Reagendar agendamento (mudar data/hora)
- [ ] **8.5.7** Exibir comissão/invoice após criação (mockado)

#### Sprint 8.6: Dashboard Médico
- [ ] **8.6.1** Criar `frontend_src/pages/DashboardDoctor.ts` (layout básico)
- [ ] **8.6.2** Seção: "Meus Agendamentos" (listar, filtros)
- [ ] **8.6.3** Seção: "Meus Horários Disponíveis" (listar, editar)
- [ ] **8.6.4** Modal: "Cadastrar Horário" (day_of_week, start_time, end_time)
- [ ] **8.6.5** Seção: "Minhas Comissões" (monthly summary)
- [ ] **8.6.6** Seção: "Solicitar Exame" (modal com campo exam_name)
- [ ] **8.6.7** Seção: "Escrever Prescrição" (modal com campo medication_name)

#### Sprint 8.7: Dashboard Admin
- [ ] **8.7.1** Criar `frontend_src/pages/DashboardAdmin.ts` (layout básico)
- [ ] **8.7.2** Seção: "Usuários" (listar com filtros, editar, deletar)
- [ ] **8.7.3** Seção: "Profissionais" (listar, ver comissões)
- [ ] **8.7.4** Seção: "Agendamentos" (listar todos, ver detalhes)
- [ ] **8.7.5** Seção: "Exames" (listar todos)
- [ ] **8.7.6** Modal: "Criar Usuário" (nome, email, role, CPF)

#### Sprint 8.8: Styling & UX
- [ ] **8.8.1** Criar `frontend_src/styles/forms.css` (inputs, buttons, validação)
- [ ] **8.8.2** Implementar feedback visual: borda vermelha + mensagem de erro
- [ ] **8.8.3** Loading states (botões disabled, spinner)
- [ ] **8.8.4** Responsive design (mobile-first)

---

### 🧪 FASE 9: TESTES (20 tarefas)

#### Sprint 9.1: Setup Mocha + Chai
- [ ] **9.1.1** Instalar Mocha, Chai, sinon para mocking
- [ ] **9.1.2** Configurar arquivo `mocharc.json`
- [ ] **9.1.3** Criar database de teste (in-memory ou separada)
- [ ] **9.1.4** Implementar hooks: beforeEach (seeding), afterEach (cleanup)

#### Sprint 9.2: Testes de Autenticação (Consolidado)
- [ ] **9.2.1** 5 testes Auth (já listados em Sprint 2.4)

#### Sprint 9.3: Testes de Usuários (Consolidado)
- [ ] **9.3.1** 6 testes Users (já listados em Sprint 3.4)

#### Sprint 9.4: Testes de Profissionais (Consolidado)
- [ ] **9.4.1** 6 testes Professionals (já listados em Sprint 4.5)

#### Sprint 9.5: Testes de Agendamentos (Consolidado)
- [ ] **9.5.1** 13 testes Appointments (já listados em Sprints 5.8 e 5.9)

#### Sprint 9.6: Testes de Exames & Prescrições (Consolidado)
- [ ] **9.6.1** 6 testes Exams & Prescriptions (já listados em Sprint 6.2)

#### Sprint 9.7: Coverage Report
- [ ] **9.7.1** Rodar `npm test` com cobertura (nyc)
- [ ] **9.7.2** Garantir >80% coverage em backend
- [ ] **9.7.3** Gerar relatório HTML de coverage
- [ ] **9.7.4** Documentar testes no README

---

### 📦 FASE 10: DEPLOY & DOCUMENTAÇÃO (10 tarefas)

#### Sprint 10.1: Backend Deploy
- [ ] **10.1.1** Criar `Procfile` para Heroku/Railway
- [ ] **10.1.2** Configurar variáveis de ambiente (.env.example)
- [ ] **10.1.3** Build: `npm run build`
- [ ] **10.1.4** Deploy no Railway/Render (staging)
- [ ] **10.1.5** Validar CORS em produção
- [ ] **10.1.6** Testar endpoints em staging

#### Sprint 10.2: Frontend Deploy
- [ ] **10.2.1** Build: `npm run build:frontend`
- [ ] **10.2.2** Deploy no GitHub Pages
- [ ] **10.2.3** Configurar CORS request para staging API
- [ ] **10.2.4** Testar fluxos completos (auth, agendamento, etc)

#### Sprint 10.3: Documentação
- [ ] **10.3.1** Criar `README.md` com setup local, comandos, variáveis
- [ ] **10.3.2** Documentar API routes completas (OpenAPI/Swagger opcional)
- [ ] **10.3.3** Documentar estrutura de código + padrões
- [ ] **10.3.4** Criar guia de troubleshooting

---

## 📊 COLUNA 2: IN PROGRESS (Em Progresso)

*(Será preenchida durante execução)*

---

## ✅ COLUNA 3: DONE (Concluído)

*(Será preenchida durante execução)*

---

## 📈 Estatísticas

| Métrica | Valor |
|---------|-------|
| **Total de Tarefas** | 127 |
| **Fases** | 10 |
| **Sprints** | 43 |
| **Estimativa** | 2-3 semanas |
| **Equipe Recomendada** | 2-3 devs (1 backend, 1 frontend, 1 QA/DevOps) |

---

## 🎯 Critérios de Sucesso (DoD - Definition of Done)

- [ ] Código compilado e sem erros TypeScript
- [ ] Testes unitários passando (>80% coverage)
- [ ] Código revisado (code review)
- [ ] Documentação atualizada
- [ ] Funcionalidade testada manualmente
- [ ] Commits semânticos (feat:, fix:, test:)
- [ ] Sem console.log de debug

---

## 🚀 Próximos Passos Imediatos

1. **Criar repositório Git** (Sprint 1.1.1)
2. **Instalar dependências** (Sprint 1.1.2)
3. **Definir schema.sql** (Sprint 1.2.1)
4. **Começar com Autenticação** (Fase 2)

**Boa sorte! 🚀**

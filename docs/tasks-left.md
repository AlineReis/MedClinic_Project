---
title: Tasks left to reach the MedClinic MVP
---

# Pendências do MVP MedClinic

Este inventário cruza as principais referências técnicas (Especificação Consolidada, Kanban, Regras de Negócio, rotas documentadas e modelo de dados) com o que o backend já entrega. Faltam os itens abaixo.

## 1. Agendamentos & Pagamentos (Fase 5)

- [ ] **Processamento de pagamento mock + invoice.**
  - `AppointmentService.scheduleAppointment` apenas persiste o agendamento. Deve acionar um `PaymentMockService` com 80% de aprovações, calcular MDR 3,79%, salvar em `transactions`/`commission_splits` e retornar invoice/redirecionamento conforme `DOC_API_ROTAS` (POST `/appointments`).
- [ ] **Todas as validações de negócio RN-01 a RN-07.**
  - Atualmente só há validação de data futura e duplicação (RN-04). Faltam: disponibilidade em `availabilities` (RN-01), antecedência mínima de 2h presencial/1h online (RN-02), limite de 90 dias (RN-03), bloqueio de horários conflitantes (RN-06) e lembretes (RN-07). Nenhuma regra de duração por especialidade é aplicada.
- [ ] **Cancelamento com reembolso automático.**
  - O endpoint `/appointments/:id/cancel` apenas troca o status. Precisa aplicar RN-21 (>24h 100%) e RN-22 (<24h 70%), registrar reembolso em `refunds`, atualizar o status da transação e retornar a mensagem+valor conforme `DOC_API_ROTAS`.
- [ ] **Reagendamento e cancelamento definitivo.**
  - Não há `POST /appointments/:id/reschedule` nem `DELETE /appointments/:id` (Kanban 5.6/5.7). O re-agendamento deve revalidar slot/antecedência sem taxa e preservar payment_status. O delete precisa aplicar política e evitar apagar dados históricos.
- [ ] **Integração financeira completa.**
  - Nenhum serviço grava automaticamente em `transactions`, `commission_splits`, `monthly_reports` ou `refunds`. O seed insere valores manualmente, mas o fluxo real precisa gerar transações, aplicar splits (60/35/5) e registrar relatórios mensais (RN-18, RN-26, RN-28).

## 2. Profissionais & Usuários (Fases 3 e 4)

- [ ] **Comissões do profissional (GET /professionals/:id/commissions).**
  - O backend não lê `commission_splits` nem calcula summary/pagination/status (Kanban 4.4.1‑4.4.5, `DOC_API_ROTAS`).
- [ ] **Gestão completa de usuários multi-clínica.**
  - Faltam os endpoints `POST /users` (clinic_admin cria outros roles) e `DELETE /users/:id` com soft delete que verifica pendências de consultas/transações (DOCS e Kanban 3.1‑3.4). O repositório ignora o `clinic_id` dos filtros e a desativação não impede re-agendamentos.
- [ ] **Disponibilidade filtrada + slots descontados.**
  - `GET /professionals/:id/availability` retorna apenas slots futuros com `is_available: true` (sem indicar bloqueio). Precisa suportar query `days_ahead` com limite de 90 dias, descontar agendamentos confirmados e indicar quais slots foram ocupados (Kanban 4.3.2‑4.3.4, RN-01).

## 3. Exames, Prescrições e Relatórios (Fase 6 a 10)

- [ ] **Fluxo completo de exames.**
  - As rotas existem, mas faltam campos obrigatórios descritos nas Regras (exemplo: `clinical_indication`, `appointment_id` obrigatórios) e recursos como upload/liberação de resultados, notificações, links para download, estados `scheduled`, `processing`, `ready` etc. Também não há endpoints de pagamento específico nem cron jobs para coletores.
- [ ] **Prescrições com PDF/assinatura.**
  - Ainda não há geração de PDF nem assinatura digital, o que é esperado (RN-4, RN-27). Também falta endpoint para `GET /prescriptions/:id/download` documentado nas regras.
- [ ] **Dashboards financeiros e relatórios mensais.**
  - Mesmo com tabelas no schema, não há endpoints `GET /reports/financial`, `/reports/commissions`, `/reports/dashboard`, nem geração automática de relatórios ou marcação de status/datas (Kanban 4.4, 10.3, RN-28).

## 4. Infraestrutura & Qualidade

- [ ] **Cobertura de testes >80%.**
  - A base tem alguns testes (`src/__test__`), mas os Kanbans apontam testes abrangentes em todos serviços e validações (Fases 2‑6, Sprint 9). A cobertura ainda não foi medida/garantida (doc `test-coverage-steps.md`).
- [ ] **Documentação e deploy.**
  - Faltam instruções unificadas no README, `Procfile`, scripts de `npm run test` com cobertura (nyc) e guias de deploy para Railway/Render (Fase 10). Também não existe front-end vinculado (Fase 8) nem seu deploy (GitHub Pages).

> **Resumo:** o backend cumpre boa parte das rotas e modelos básicos, mas ainda precisa conectar os fluxos financeiros, validar todas as regras de negócio, expandir os endpoints administrativos e documentar/deployar o sistema completo. Esta lista deve ser atualizada conforme novas implementações forem entregues para manter o roadmap vivo.

## 5. Rotas implementadas até agora

- `POST /api/v1/:clinic_id/auth/register`: registra pacientes (role forçado para `patient`), valida email/CPF/senha, retorna objeto user + JWT.
- `POST /api/v1/:clinic_id/auth/login`: autentica email+senha, seta cookie HttpOnly e responde com dados básicos do usuário.
- `POST /api/v1/:clinic_id/auth/logout`: limpa o cookie `token`.
- `GET /api/v1/:clinic_id/auth/profile`: retorna dados do usuário logado a partir do middleware de autenticação.
- `GET /api/v1/:clinic_id/users`: restrito a clinic_admin/receptionist/system_admin, aplica filtros simples (role/search/paginação) e retorna lista paginada.
- `GET /api/v1/:clinic_id/users/:id`: retorna o usuário solicitado se o requester for o próprio usuário ou admin da clínica.
- `PUT /api/v1/:clinic_id/users/:id`: permite que paciente atualize name/email/phone/password (com validações) e que admins atualizem campos básicos, mas bloqueia role/password para terceiros.
- `GET /api/v1/:clinic_id/appointments`: endpoint unificado para listar consultas com filtros (status, date, upcoming, professional_id/patient_id) e RBAC (paciente vê só os seus, médico só sua agenda, recepção/admin todos).
- `GET /api/v1/:clinic_id/appointments/:id`: retorna o agendamento se o requester for paciente/médico relacionado ou um perfil autorizado (recepção/admin).
- `POST /api/v1/:clinic_id/appointments`: cria agendamento garantindo que o paciente (quando logado) só agende para si e valida conflitos de duplicação.
- `PATCH /api/v1/:clinic_id/appointments/:id/confirm`: muda status para `confirmed`, negando pacientes.
- `POST /api/v1/:clinic_id/appointments/:id/cancel`: exige motivo e permite que paciente cancele o próprio agendamento atualizando status e registrando quem cancelou (ainda sem política de reembolso).
- `POST /api/v1/:clinic_id/professionals`: cadastro de profissional, incluindo usuário, detalhes e horários via `ProfessionalService.register`.
- `GET /api/v1/:clinic_id/professionals`: lista profissionais públicos com filtros de specialty/name/paginação.
- `GET /api/v1/:clinic_id/professionals/:id/availability`: lista slots baseados em regras de availabilities, filtra os horários já ocupados e limita `days_ahead` a 90 dias.
- `POST /api/v1/:clinic_id/professionals/:id/availability`: cadastra blocos de disponibilidade, valida conflitos e sobreposição.
- `GET /api/v1/:clinic_id/exams/catalog`: retorna catálogo ativo de exames.
- `POST /api/v1/:clinic_id/exams`: solicita exame para uma consulta existente, valida catálogo ativo e registra payment_status `pending`.
- `GET /api/v1/:clinic_id/exams`: lista requisições filtradas por contexto do usuário (paciente, médico, lab_tech/admin).
- `GET /api/v1/:clinic_id/exams/:id`: retorna os dados do exame se o requester tiver permissão (paciente solicitante, médico, lab tech, admins).
- `POST /api/v1/:clinic_id/prescriptions`: médicos criam prescrições vinculadas a consulta com validação do profissional.
- `GET /api/v1/:clinic_id/prescriptions`: lista prescrições conforme contexto (paciente vê suas, médico as que fez).
- `GET /api/v1/:clinic_id/prescriptions/:id`: retorna prescrição se o requester for paciente/médico/admin.

## 6. Rotas e recursos ainda pendentes segundo o escopo oficial

- `POST /api/v1/:clinic_id/users` e `DELETE /api/v1/:clinic_id/users/:id`: criação de outros roles pelo clinic_admin e soft delete com verificação de pendências (Kanban 3.2/3.3, DOC_API_ROTAS).
- `DELETE /api/v1/:clinic_id/appointments/:id` e `POST /api/v1/:clinic_id/appointments/:id/reschedule`: delete deve aplicar política de cancelamento, reagendamento deve revalidar slot sem taxa e manter payment_status (Kanban 5.6/5.7).
- `POST /api/v1/:clinic_id/appointments/:id/checkin`, `/start`, `/complete`, `/no-show`: ainda não existem rotas para controlar status de atendimento (REGRAS_DE_NEGOCIO_MINI_DESAFIO, RFC de atendimento).
- `GET /api/v1/:clinic_id/professionals/:id/commissions`: endpoint exige resumo/pagination/status e cálculo automático de 60% do líquido (Kanban 4.4, DOC_API_ROTAS).
- Rotas de pagamentos separados: `GET /api/v1/:clinic_id/payments`, `/payments/:id`, `/payments/:id/refund`: necessário suportar histórico, refund manual e integrações com transactions (docs/MedclinicDB_Implementacao e DOC_API_ROTAS).
- Relatórios (`/reports/dashboard`, `/reports/financial`, `/reports/commissions`, `/reports/generate-monthly`, `/reports/:id/export`): nenhum endpoint foi criado para gerar ou expor relatórios financeiros/comissões (Kanban fase 10, Regras §8).
- Exames: endpoints de resultado (`POST /exams/:id/upload-result`, `/exams/:id/release-result`, `/exams/:id/download`) e agendamento de coleta ainda ausentes (DOC_API_ROTAS §Exames). Também faltam notificações e pagamentos específicos de exame (RN-11, RN-15).
- Prescrições: falta `GET /prescriptions/:id/download` com PDF/assinatura digital e controles de prescrição controlada (DOCS_DE_NEGOCIO §3).
- Dashboard admin/front-end public documentado (Fase 8) e front/back deploy (Fase 10) também não existem no backend, mas valem mencionar aqui por alinhamento ao roadmap.

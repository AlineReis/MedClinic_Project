# HANDOFF - Integração Frontend ↔ Backend (framework RALPH)

Este documento resume o estado atual e os próximos passos de integração entre as equipes de frontend e backend, seguindo o plano presente em `docs/plan2.md`.

## Estado Atual da Integração

- `apiService` já aplica `credentials: 'include'`, headers `Accept`/`Content-Type`, normaliza JSON e dispara toasts para `error.message`.
- `authStore` expõe `refreshSession()` que aciona `/auth/profile`, mantém `isCheckingAuth` e publica `auth-ready`; `auth-ready` é aguardado pelo entrypoint antes de liberar rotas.
- `roleRoutes` garante redirecionamento baseado em `UserSession.role` e `authBlocker` overlay bosqueja a UI até o auth for validado.
- `docs/plan2.md` documenta responsabilidades criticas por squad (auth, dashboards, scheduling, doctors, clinical, admin, infra) alinhadas ao contrato REST (RN-01~05 e RN-09~28).

## Próximos Pontos Prioritários

1. **Step 3 obrigatório (Plan2)**: priorizar a agenda do paciente e o `dashboardStore` que consome `GET /appointments?patient_id`, `GET /exams?patient_id` e `GET /prescriptions?patient_id`, aplicando estados `loading/empty/error` antes de seguir para outras áreas.
2. **Slots/Agendamentos (Equipe Scheduling)**: implementar `GET /professionals`, `GET /professionals/{id}/availability`, `POST /appointments`, `DELETE /appointments/{id}` e `POST /appointments/{id}/reschedule`, garantindo cache de profissionais, validações RN-01 a RN-05, modais para pagamento mock e mensagens específicas (`SLOT_NOT_AVAILABLE`, `INSUFFICIENT_NOTICE`, etc.).
3. **Dashboards**: sincronizar `dashboardStore` com filtros por status/patient/professional e consumir `GET /professionals/{id}/commissions` para o painel médico, mantendo `roleRoutes` e `authStore` como singletons seguros.
4. **Exames/Prescrições**: criar `clinicalStore` (ou integrar ao dashboard) para listar e detalhar exames (`GET /exams`, `GET /exams/:id`, `POST /exams`) e prescrições (`GET /prescriptions`, `GET /prescriptions/:id`, `POST /prescriptions`), com RBAC e toasts de erro.
5. **Admin/Reports**: fornecer datagrids com `GET /users`, `PUT /users/:id`, `DELETE /users/:id`, relatórios (`GET /reports/*`) e visão financeira (`GET /appointments?status=paid`), respeitando RBAC `clinic_admin/system_admin`.
6. **Infraestrutura transversal**: refatorar estilos para tokens (`css/variables.css`), documentar fluxos RN e estados, planejar testes (manual + Mocha/Chai) e garantir que `webpack` injete `CLINIC_API_HOST`/`PAYMENT_MOCK_KEY` conforme `docs/contrato-de-integracao.md`.

## Notas para Equipes Paralelas

- Todos devem consultar `docs/plan2.md` antes de iniciar uma nova área; o documento define os endpoints, mensagens de erro, RN obrigatórias e sequência segura.
- Qualquer mudança afetando `apiService`, stores (`authStore`, `dashboardStore`, `uiStore`) ou rotas precisa ser coordenada para evitar conflitos e deve sinalizar no `PROGRESS-backend-integration.md`.
- Os toasts (`uiStore`) devem exibir mensagen de erro do backend (`error.code`, `error.message`) e não duplicar o tratamento, usando `handleError` centralizado.
- Durante a integração, mantenha as validações RN no frontend (ex: `slot.start_time` vs `min_notice`, duplicidade de consultas) antes de chamar o backend.

## Checklists RALPH / GSD

- [ ] Conferir que cada endpoint listado no handoff tem um mock ou stub no `apiService` antes do backend ficar disponível.
- [ ] Garantir `authReadyPromise` resolve antes de montar dashboards e que `roleRoutes` impede acesso indevido.
- [ ] Atualizar `PROGRESS-backend-integration.md` após cada sprint para manter rastreamento.
- [ ] Documentar qualquer novo RN concluído e as métricas/tokens no `docs/plan2.md` e neste handoff.

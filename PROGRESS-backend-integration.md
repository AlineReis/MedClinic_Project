## Backend Integration Progress

- Implemented resilient `apiService` with shared headers, JSON parsing guards, and consistent error models to prepare for real `/auth/*` calls.
- Added `authStore.refreshSession()` that retries on transient network errors, tracks `isCheckingAuth`, publishes `auth-ready` once session validated, and clears session on 401.
- Created shared `roleRoutes` config, updated login to reuse it, and ensured role-based redirects work from the login flow.
- Entry point now renders `authBlocker`, awaits `refreshSession()`, redirects based on role, exposes `authReadyPromise`, and dispatches `auth-ready` only after matching role and path.
- Protected dashboard initialization by listening to `auth-ready` and updated global CSS with overlay/spinner styles for the blocker.
- Drafted `docs/plan2.md`, documenting detailed integration responsibilities per squad (auth, dashboards, scheduling, doctors, clinical, admin, infrastructure) based on the API contract so multiple engineers can work in parallel.

## Integration Plan (Aligned with Kanban + JWT Behavior)

**Objective:** Bridge the existing vanilla frontend to the backend APIs while following the MedClinic MVP Kanban flow and honoring the HttpOnly JWT constraint (the token cant be read directly, so `/auth/profile` becomes our source of truth for verifying authentication status).

**Phased Work (per `docs/possivel-referencia/MedClinic MVP Kanban de Tarefas Atômicas.md`):**

1. **Fase 2 – Autenticação:**
   - Hardened `src/services/apiService.ts` with `CLINIC_API_HOST`, uniform JSON error handling, and an `onUnauthorized` hook to keep cookies and RBAC intact.
   - Added `src/services/authService.ts` for typed `/auth/login`, `/auth/register`, `/auth/profile`, and `/auth/logout` integrations.
   - Refactored `src/stores/authStore.ts` to rely on the auth service, refresh via `/auth/profile`, surface toasts, and reset on unauthorized responses.
   - Updated `src/pages/login.ts` to consume `authService`, validate credentials, persist session only after `/auth/profile` confirms the JWT, and continue to use `uiStore` toasts.

2. **Fase 3 – Usuários:**
   - Update user-facing screens (e.g., registration, profile edit) to call `/users` endpoints through centralized services (no direct fetch in components) and consume pagination filters as defined in the contract.
   - Keep role-based UI logic in `src/stores/uiStore.ts` in sync with the profile payload.

3. **Fase 4 – Profissionais e Disponibilidades:**
   - Build adapters/services that fetch `/professionals`, `/professionals/:id/availability`, and handle filters/slots data for appointment booking sections.
   - Lay groundwork for posting availabilities under authenticated sessions (producer is health_professional or admin) once the API is ready.

4. **Fase 5 – Agendamentos:**
   - Connect the scheduling UI (e.g., appointment cards, booking modals) to `/appointments` endpoints, enforce RN-01..RN-07 on the frontend by showing server-provided slot availability and errors, and display payment hints based on the mock CloudWalk response.
   - Interpret error codes (INSUFFICIENT_NOTICE, SLOT_NOT_AVAILABLE, DUPLICATE_APPOINTMENT, etc.) to show friendly alerts.

**Supporting Steps:**

- **API Services:** Expand `src/services/apiService.ts` to expose typed helper methods (`auth.login`, `auth.profile`, `users.list`, `professionals.list`, `appointments.create`, etc.) so components/stores remain thin adapters.
- **Stores:** Each store (auth, dashboard, ui) will orchestrate calls to these services, transform responses to domain models, and handle loading/error states, preserving single responsibility.
- **Adapters/Transformers:** Implement small mappers near the services to translate backend payloads into UI-friendly shapes (e.g., map professional specialties, slot availability, appointment status badges) without leaking backend structures into the DOM layer.
- **Error Handling:** Standardize toast/modal messaging for API errors using the global error format from the docs (code + message + http status) and surface server validation issues per field where possible.
- **JWT Handling:** Because the JWT is HttpOnly, theres no localStorage access; instead, rely on `/auth/profile` during app initialization and on-demand to determine the logged-in user and enforce RBAC within the frontend.

**Success Criteria:**

- Login/register flows complete with backend validation and set the UI state only when `/auth/profile` confirms the cookie, preventing stale session assumptions.
- Navigating to dashboards attempts to refresh the session, waits on `authReadyPromise`, and only renders protected content when RBAC matches the user role.
- Appointment, professional, and user listing features consume real data from `/appointments`, `/professionals`, and `/users`, showing server-provided pagination/errors and reflecting RN constraints in UI prompts.
- All service calls go through the shared `apiService` so we maintain consistent headers, error parsing, and JWT cookie transmission (browsers handle HttpOnly cookies automatically when `credentials: 'include'`).

**Next Action:** Document this plan as a shared artifact for the team (done here) and schedule the next work sprint focusing on finishing Authentication (Fase 2) before moving down the Kanban columns.

## 2026-01-29 Updates (sessões 4-19)

- Added `src/services/appointmentsService.ts` to centralize `/appointments` queries with typed filters and adapter mapping to frontend-friendly summaries.
- Created `src/types/appointments.ts` to share appointment summary typing between services and stores.
- Updated `src/stores/dashboardStore.ts` to use `appointmentsService` (no direct fetch), keeping SRP and adapter boundaries.
- Fixed login flow to accept backend payloads that return `{ success, user }` and corrected patient seed credentials in `src/pages/login.ts`.
- Updated login seed credentials for lab_tech and health_professional (and aligned other roles) to match `docs/REGRAS_DE_NEGOCIO_MINI_DESAFIO.txt`.
- Updated `webpack.config.js` to inject the `main` bundle into dashboard pages (patient/reception/doctor/lab/manager/admin) and prevent CopyWebpackPlugin from overwriting them.
- Restricted appointment loading in `src/index.ts` to roles that need it (patient, receptionist, health_professional).
- Added typed `exams` and `prescriptions` models plus dedicated services (`examsService`, `prescriptionsService`) to load patient clinical data from `/exams` and `/prescriptions`.
- Extended `dashboardStore` to fetch appointments, exams, and prescriptions in parallel, track loading/error state, and dispatch unified dashboard updates.
- Implemented `src/pages/patientDashboard.ts` to render next appointment and recent activity feed with real store data, session-aware UI, and logout flow.
- Updated `pages/patient-dashboard.html` placeholders to support live data and added a toast container; removed legacy mock script tags for the patient dashboard.
- Updated `webpack.config.js` to emit a dedicated `patientDashboard` bundle for the patient dashboard page.
- Patient dashboard now loads only appointments and prescriptions; exams are fetched on demand in `pages/exams.html` for patient role.
- Added `src/pages/myAppointments.ts` to fetch `/appointments?patient_id={id}` and `src/pages/examsPage.ts` to fetch `/exams?patient_id={id}` with session-based redirects.
- Introduced `pages/schedule-appointment.html` (copied from `index.html`) and updated navigation links/buttons to point to it.
- Updated root `index.html` flow to redirect to login or the appropriate role dashboard based on session.
- Registered new bundles for my-appointments, exams, and schedule-appointment in `webpack.config.js`.
- Added professionals types/service and wired `schedule-appointment` to load `/professionals` from the API, replacing mock data in the scheduling portal.
- Extended professionals types/service with availability response typing and `getProfessionalAvailability` helper aligned with `/professionals/:id/availability`.
- Updated `src/pages/scheduleAppointment.ts` with dynamic filters (specialty/name), live search, and availability preview on “Ver Horários” with toast feedback.
- Normalized `/professionals` response handling to accept raw arrays and adjusted card rendering to gracefully handle missing CRM/council fields.
- Hardened `listProfessionals` to handle raw array payloads (no `success/data`) and fallback on invalid response structures.
- Normalized `/professionals/:id/availability` to accept array-only payloads when the backend omits the standard response envelope.
- Updated availability slot typing and schedule-appointment preview logic to use `is_available` from the backend payload.
- Adjusted schedule-appointment availability rendering to consume flat availability arrays and aligned the card layout with the legacy `app.js` markup.
- Fixed `getProfessionalAvailability` typing to consistently return `ApiResponse<ProfessionalAvailabilityEntry[]>`.
- Restored the checkout/payment modal from `app.js`, wiring slot buttons to open the modal in `scheduleAppointment.ts`.
- Reintroduced the appointment status/list panel in `src/pages/scheduleAppointment.ts` so patients can see their next booking status before browsing professionals (Step 3).
- Added horizontal scroll, appointment count badge, and descriptive header for the Agendamentos panel.
- Filtered availability previews to future slots and limited the appointment list to the three next upcoming bookings, ignoring past entries.
- Implemented `appointmentsService.createAppointment` and wired the checkout modal to POST `/appointments`, using backend prices and toast feedback to report success/errors during Step 3.

## 2026-01-29 Session Notes (Merge + Dashboard)

- Removed the duplicate `src/pages/patient-dashboard.ts` file; the canonical implementation now lives in `src/pages/patientDashboard.ts`.
- Initialized `ToastContainer` and `Navigation` only after `DOMContentLoaded` to avoid missing DOM targets.
- Ensured patient dashboard header hydration runs after `authStore.refreshSession()` so the UI updates once the session is available.
- Hardened `Navigation` to guard against empty names and to compute initials safely.
- Observed that `/auth/profile` currently returns `{ id, email, role }` without `name`, which is why the header stays blank (backend dependency).
- Logout toast depends on backend returning `success: false`; offline behavior differs from login because it returns a network error rather than a success envelope.

## 2026-01-29 Session Notes (Cancelamento, Reagendamento e Erros RN)

### Contratos de Erro RN Documentados

| Código de Erro | HTTP Status | Mensagem Amigável |
|----------------|-------------|-------------------|
| `SLOT_NOT_AVAILABLE` | 409 | Este horário não está mais disponível. Por favor, escolha outro. |
| `INSUFFICIENT_NOTICE` | 400 | Agendamento requer antecedência mínima de 2 horas para consultas presenciais. |
| `DUPLICATE_APPOINTMENT` | 409 | Você já possui um agendamento com este profissional nesta data. |
| `NEW_SLOT_NOT_AVAILABLE` | 409 | O novo horário selecionado não está disponível. |
| `CANNOT_CANCEL` | 400 | Não é possível cancelar este agendamento no status atual. |
| `APPOINTMENT_NOT_FOUND` | 404 | Agendamento não encontrado. |
| `PROFESSIONAL_NOT_FOUND` | 404 | Profissional não encontrado. |
| `FORBIDDEN` | 403 | Você não tem permissão para realizar esta ação. |
| `OVERLAPPING_TIMES` | 409 | Os horários informados se sobrepõem. |

### Implementações Realizadas

- **`appointmentsService.ts`**: Adicionados métodos `cancelAppointment(id, reason?)`, `rescheduleAppointment(id, { newDate, newTime })`, `getAppointment(id)` e helper `getErrorMessage(code, fallback)`.
- **`scheduleAppointment.ts`**:
  - Cards de agendamento agora exibem botões "Reagendar" e "Cancelar" para status `scheduled` ou `confirmed`.
  - Modal de cancelamento com campo de motivo opcional e informações sobre reembolso (70% se <24h).
  - Modal de reagendamento carrega slots disponíveis do profissional para os próximos 14 dias.
  - Tratamento de erros atualizado para usar `getErrorMessage()` com mapeamento RN.
  - Após cancelar ou reagendar, o painel de agendamentos é recarregado via `loadPatientAppointments()`.

### Regras de Negócio Aplicadas

- **RN-01 (Disponibilidade)**: Slots indisponíveis retornam `SLOT_NOT_AVAILABLE`.
- **RN-02 (Antecedência)**: Mínimo 2h para presencial, erro `INSUFFICIENT_NOTICE`.
- **RN-03 (Máximo 90 dias)**: Validado pelo backend.
- **RN-04 (Sem duplicidade)**: Erro `DUPLICATE_APPOINTMENT` quando já existe consulta com mesmo profissional na data.
- **RN-05 (Cancelamento/Reembolso)**: >24h = 100%, <24h = 70%. Modal exibe informações de reembolso retornadas pelo backend.

## 2026-01-29 Session Notes (Status Consolidado)

- [x] **Doctor Dashboard** integra status reais, comissão, agenda e gestão de disponibilidade com `src/pages/doctorDashboard.ts`, `src/services/professionalsService.ts` e `pages/doctor-dashboard.html` atualizados, respeitando RBAC para `health_professional`.
- [x] **Reception Dashboard** busca `GET /appointments?date={hoje}` e entrega estatísticas, check-in e toasts com placeholders até PATCH/INTEGRACAO confirmada.
- [x] **Admin & Users**: `adminDashboard` e `usersPage` consomem `/users`, `/appointments` e `/professionals`, com filtros/pagination e ações (PUT/DELETE) acompanhadas de tratamento de erro 403/409.
- [x] **Clinical Flows**: `examsService`, `prescriptionsService` e as modais no doctor dashboard consomem `/exams`, `/prescriptions`, incluindo TODOs de RBAC e mensagens `EXAM_NOT_FOUND`, `PRESCRIPTION_NOT_FOUND`.
- [x] **Scheduling Core**: `appointmentsService` cobre listagem, cancelamentos, reagendamentos e criação com RN-01..05, e `scheduleAppointment` + `myAppointments` + `scheduleAppointment.ts` consomem dados reais.
- [x] **Shared Infrastructure**: `apiService`, `authService`, `authStore`, `uiStore`, `webpack.config.js`, `ToastContainer` e todos os `pages/*.html` alinhados com as integrações, garantindo loaders, empty states e RBAC.

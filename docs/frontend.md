---
title: Frontend prompt for IA
---

# Frontend Design Prompt for MedClinic MVP

Use this prompt to instruct an AI-based UI designer how to build the frontend screens that consume the existing MedClinic API. The frontend must follow the MVP specs (vanilla TypeScript, HTML5/CSS3, responsive, no frameworks) and integrate with the documented backend routes (`docs/DOC_API_ROTAS.md`) while respecting the business rules (`docs/MedClinic MVP - Especificação Consolidada.md` and `docs/DOCS_REGRAS_NEGOCIO.md`).

## Prompt Structure

1. **Context & Goals**
   - Describe the product: MedClinic is a medical clinic management dashboard with patient, professional, admin flows.
   - Highlight that the API is already implemented for authentication, user management, appointments, professionals, exams, and prescriptions.
   - Emphasize must-build features: login/register, dashboards for patient/doctor/admin, appointment booking/cancellation/rescheduling, professional availability management, exam requests, prescription creation/view, notification/feedback components.

2. **Screens & Layout Guidance**
   - **Login & Patient Registration**
   - Provide responsive forms with client-side validation (email, CPF format, password strength, phone). Show error states (red borders/messages) and success toasts.
   - **Patient Dashboard**
   - Section for "Meus Agendamentos" with filters (status, upcoming), booking widget that lists professionals (filtered by specialty), date picker constrained by availability API, slot selection based on professional availability endpoint, and cta to cancel/reschedule. Include invoice view (mock) and links to exams/prescriptions.
   - **Doctor Dashboard**
   - Display agenda (list/calendar) using `GET /appointments` with role-filtered view. Include availability manager (list existing slots, form to add new availability). Show commission summary panel (note: backend endpoint missing; placeholder info). Provide quick actions to create exam requests / prescriptions referencing API payloads.
   - **Admin Dashboard**
   - Multi-tab layout (Usuários, Profissionais, Agendamentos, Exames, Prescrições). Each tab uses table/list with pagination controls, search/filter inputs, actions (edit/delete user, view appointment detail). Provide modals for creating users/professionals referencing docs (role restrictions, CPF validation, etc.).
   - **Shared Components**
   - Header with user info/logout, sidebar navigation, toast/alert system, modal overlay component, form field components (inputs/selects) with validation feedback, responsive grids.

3. **Interactions with API**
   - Use `auth` routes for login/register/logout/profile.
   - Fetch users via `/users` (with clinic_id path param) for admin views, send PUT updates with validation.
   - Appointment flows should call `/appointments` for list/create/cancel (future reschedule endpoint placeholder). Axios/fetch helper should include credentials cookie.
   - Professional list and availability should call `/professionals` and `/professionals/:id/availability` endpoints.
   - Exam/prescription creation forms must require the fields indicated in the API docs (appointment_id, clinical_indication, medication_name, etc.) and show success/error messages.

4. **UI Constraints & Accessibility**
   - Keep vanilla TS + HTML/CSS. Avoid frameworks. Use semantic HTML for forms/lists, accessible labels, keyboard-friendly modals, and color contrast meeting WCAG AA.
   - Include loading states (spinners or disabled buttons) when calling APIs, error banners for failures, and confirmations for destructive actions (cancel appointment, delete user).

5. **Output Format**
   - Ask the AI to produce a folder structure (e.g., `frontend_src/pages`, `components`, `styles`, `services`), stub `.ts` files per screen, and CSS files. Provide mock data or API hooks to illustrate data flow.
   - Require the AI to describe how to wire each form/component to the API endpoints, including necessary headers/cookies and expected JSON payloads/responses.

Use this document whenever you need to generate the frontend experience using generative tools. Update it as the backend evolves (new endpoints, validation rules, workflows).

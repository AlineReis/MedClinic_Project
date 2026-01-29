## Markdown File Summary

### Progress & Planning Logs

- **PROGRESS-backend-integration.md**: Captures the backend integration steps (auth/session, dashboards, appointments, professionals) aligned to the Kanban flow and JWT constraints, plus a success checklist and prioritized next sprint.
- **PROGRESS.md**: Highlights current security architecture, CSS refactor status, role-based routing contract, and Tailwind-to-CSS plans, including blocker selectors and variables to declare.
- **REFATORACAO_CSS.md**: Serves as the design contract for replacing Tailwind utilities with semantic CSS tokens, enumerating color/spacing variables, reusable component classes, dependencies tied to JS selectors, and a phased cleanup roadmap.

### Core Docs

- **docs/ANALISE_PROJETO_MEDCLINIC.md**: Atomic analysis of the MedClinic UI vs. RN requirements, market gap comparisons, backlog of missing backend work, and recommended multi-phase roadmap.
- **docs/contrato-de-integracao.md**: Frontend ↔ backend contract covering base URL, cookie-based auth, response shape, required headers, error handling, caching, and retry expectations.
- **docs/DOC_API_ROTAS.md**: Extensive API reference with sample payloads/responses for auth, users, professionals, appointments, payments, and future routes, including RBAC notes and HTTP status conventions.
- **docs/estabelecimento-de-tarefas-frontend.md**: Lists sequential frontend deliverables (infra, API service, components, critical pages) mapped to the documented back-end endpoints.
- **docs/fluto-de-dados-e-estados.md**: Maps data flows and UI states for login, onboarding, dashboards, scheduling, payments, and global stores to enforce consistent loading/empty/error statuses.
- **docs/frontend-next-steps.md**: Actionable roadmap to finish apiService/stores, hook login/session handling, build patient dashboard/cards, slot selection, and payment handling before validating and updating planning docs.
- **docs/HANDOFF.md**: Snapshot of current integration state, priority next actions (patient agenda, scheduling, dashboards, clinical data, admin reports, infra), and coordination notes across stores/services.
- **docs/paginas-para-fluxos.md**: Table linking every HTML page to its main backend flow, endpoints, and special notes (RBAC, RN constraints, overlays/CTAs).
- **docs/plan2.md**: Master integration plan guiding squads through auth, dashboards, scheduling, professionals, clinical flows, admin/reports, with phased deliverables, RN compliance, and DoD/seq of work.
- **docs/planejamento-paginas-criticas.md**: Critical page planning (login, patient dashboard, slots) plus architecture and RALPH-inspired componentization/lifecycle guidelines.
- **docs/REGRAS_DE_NEGOCIO_MINI_DESAFIO.txt**: Comprehensive RN catalog covering pricing, roles and permissions, appointment/exam/payment rules, database schema, validation functions, environment variables, and seeds.
- **docs/possivel-referencia/MedClinic MVP Kanban de Tarefas Atômicas.md**: Kanban board listing phases (Auth, Users, Professionals, Appointments, Exams, middleware, frontend, tests, deploy) with sprint-by-sprint checklist and DoD metrics.

### Agent Instructions & Skills

- **docs/.agents/INSTRUCTIONS-agent.md**: Operative protocol mandating the reading order (docs/, plan2, PROGRESS, HANDOFF), bug resolution before features, and updating PROGRESS/HANDOFF after work.
- **docs/.agents/TEMPLATE-handoff.md**: Template for logging objective, progress, blockers, and next steps if a session resets; instructions to incorporate output into PROGRESS.
- **.agent/skills/design-md/README.md**: Explains the design-md skill installation, workflow, and output structure for generating DESIGN.md files.
- **.agent/skills/design-md/SKILL.md**: Skill manifest detailing how to produce DESIGN.md, describing retrieval, analysis, synthesis, and the expected file structure with styling guidance.
- **.agent/skills/design-md/examples/DESIGN.md**: Sample DESIGN.md for a Furniture Collection project demonstrating atmosphere, palette, typography, component styles, layout principles, and Stitch prompt notes.
- **.agent/skills/stitch-loop/README.md**: Describes the stitch-loop skill’s baton-based workflow for iterative site generation using Stitch, plus necessary assets and templates.
- **.agent/skills/stitch-loop/SKILL.md**: In-depth skill instructions for reading next-prompt, generating screens, integrating outputs, and orchestrating the baton cycle while updating SITE/DESIGN documentation.
- **.agent/skills/stitch-loop/examples/SITE.md**: Example SITE.md capturing project vision, sitemap, roadmap backlog, creative ideas, and rules for future iterations.

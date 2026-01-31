# MedClinic Backend

## Overview
- TypeScript-powered Express server orchestrating authentication, user management, professionals, appointments, exams, prescriptions, and finance flows against a single-file SQLite database.
- `src/server.ts` wires middleware, routers, and error handling while `src/services` and `src/repository` encapsulate contracts that keep validation logic centralized and shareable with the frontend adapters.

## Getting Started
1. Install dependencies: `npm install`.
2. Create the configuration file: `cp .env.example .env` and set `CLINIC_API_HOST`, `JWT_SECRET`, and payment mock keys as needed.
3. Initialize the database schema: `npm run db:init` (repeat after resets).
4. Seed initial data: `npm run db:seed`.
5. Run the dev server with hot reload: `npm run dev` (uses `tsx watch --tsconfig tsconfig.json src/server.ts`).
6. Build for production: `npm run build` followed by `npm start` (serves `dist/server.js`).
7. Run tests or coverage: `npm run test`, `npm run test:coverage`.
8. Reset the database during experimentation: `npm run db:reset`.

## API Surface
- **Authentication** – `/auth/register`, `/auth/login`, `/auth/profile`, and `/auth/logout` manage role-aware registration, login, HttpOnly JWT cookies, and profile refresh. Errors include `INVALID_CREDENTIALS`, `EMAIL_ALREADY_EXISTS`, `UNAUTHORIZED`, and session expiration handling.
- **Users** – List, retrieve, update, and soft-delete users with RBAC gates (`clinic_admin`, `system_admin`, `receptionist`, etc.). Validation enforces unique emails, role integrity, and rejection codes such as `FORBIDDEN` and `USER_HAS_PENDING_RECORDS` for deletions.
- **Professionals** – Public filters for `/professionals` (specialty, name, pagination) plus `/professionals/:id/availability` for slot calendars. Authenticated professionals or admins can post availability; collisions raise `OVERLAPPING_TIMES`, while `/professionals/:id/commissions` surfaces pending and paid splits.
- **Appointments** – Role-aware queries powered by `/appointments` with filtering, `/appointments/:id` detail fetch, `/appointments` creation (RN-01...RN-05 validations, CloudWalk-like payment mock), `/appointments/:id/cancel`, and `/appointments/:id/reschedule`. Error codes include `SLOT_NOT_AVAILABLE`, `DUPLICATE_APPOINTMENT`, `INSUFFICIENT_NOTICE`, `NEW_SLOT_NOT_AVAILABLE`, and refund statuses handled by `/refunds` logic.
- **Exams & Prescriptions** – `/exams`, `/exams/:id`, `/prescriptions`, `/prescriptions/:id`, `/appointments/:id/exams`, etc., capture clinical orders. Creation enforces RN-09 (clinical indication) and RN-13 (result access), keeping exam/prescription history immutable and auditable.
- **Finance** – Transactions (`/transactions` entries with MDR validation), commission splits, refunds (100% >24h, 70% otherwise), and monthly reports satisfy RN-21 through RN-28. All finance commands log `amount_gross`, `mdr_fee`, `amount_net`, and `status` for reconciliation.
- **Global Standards** – JSON success/error wrappers, consistent HTTP status usage (200/201/400/401/403/404/409/500), ISO-8601 timestamps, and secure cookie handling ensure predictable client behavior.

## Frontend Integration
- The UI documented in `README-frontend.md` depends on this backend. It consumes `/api/v1/:clinic_id` endpoints with `credentials: include`, replicas RN validations via services/adapters, and reacts to backend-toasts via `uiStore`. Any cross-domain `CLINIC_API_HOST` configuration should match this server before running the frontend stack.
- [Continue to README.md](https://github.com/AlineReis/MedClinic_Project/tree/frontend-stitch/README.md)

## Notes
- The backend ships with comprehensive unit and integration tests (`src/__test__`), leveraging Jest and `supertest` to validate routers/middlewares.
- Database helpers (see `src/config/database.ts`) ensure foreign keys and WAL mode are enabled for transactional safety.

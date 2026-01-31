# MedClinic Frontend

## Overview
- Dedicated frontend that renders all MedClinic dashboards (patient, reception, doctor, admin) and critical pages after authenticating with the backend’s `/api/v1/:clinic_id` surface.
- Built with RALPH-aligned patterns (adapters, services, stores) so requests remain decoupled from view components and error handling/from the backend stays centralized in `uiStore`.

## How to Run
1. Checkout the frontend branch and get latest: `git fetch origin && git checkout frontend-stitch && git pull origin frontend-stitch`.
2. Install dependencies: `npm install`.
3. Start the dev server: `npm run dev` (observes `tsconfig.json` and backend proxy settings).
4. Build for deployment/test: `npm run build` and verify `dist/pages` includes dashboards plus `pages/users.html`.
5. When running against this backend, ensure `CLINIC_API_HOST` points to the same host as the backend and that cookies are shared for `credentials: include` requests.

## Key Workstreams
- **Auth & Guards** – `authStore.refreshSession()` calls `/auth/profile` before rendering dashboards and exposes role info to `roleRoutes`. The UI reacts to backend error codes (`UNAUTHORIZED`, `FORBIDDEN`) by clearing session state and redirecting to `/login`.
- **Scheduling** – Creating or mutating appointments triggers chained calls: availability refresh (`GET /professionals/:id/availability`), RN validation toasts (`SLOT_NOT_AVAILABLE`, `DUPLICATE_APPOINTMENT`, `INSUFFICIENT_NOTICE`), payment mock handling (retry UI when `payment_required.status === 'failed'`), and store updates (`appointmentsStore`, `dashboardStore`).
- **Clinical/Admin Dashboards** – Reception, doctor, and admin dashboards reuse `/appointments`, `/exams`, `/prescriptions`, and `/professionals` filters while pagination/states are managed by `dashboardStore`. Modals and forms leverage specialized services (`examsService`, `prescriptionsService`, `usersService`).
- **Error Timeline** – Services convert backend errors (`OVERLAPPING_TIMES`, `USER_HAS_PENDING_RECORDS`, `NEW_SLOT_NOT_AVAILABLE`) into toasts and overlay states via `uiStore`, ensuring every action surfaces user-friendly messages.

## API Highlight Recap
- Authentication routes (`/auth/*`), user management, scheduling, availability, and finance flows are assumed available on `/api/v1/:clinic_id`. See `README.md` for the authoritative backend definitions.
- Clients must supply `credentials: include` to send the JWT cookie automatically, relying on same-site policies handled by the backend.

## Notes
- This README focuses on the frontend; the backend README (`README.md`) describes the API surface, database, and finance flows.
- Both sides share RN validations, so keep adapters/services in sync when updating payload contracts.

## Test Coverage Roadmap

### Executive Summary

- **Current coverage:** 63.44% statements / 62.82% branches / 71.82% functions / 63.44% lines (via `npm run coverage`).
- **Target coverage:** ≥ 80% statements & lines, with strong branch/function coverage.
- **Gap focus:** primarily in `src/repositories/*`, plus `src/services` (Exam/Prescription) and several controllers.

### The High-Impact List

1. `src/repositories/*` – repositories have the bulk of uncovered statements especially around CRUD helpers and query builders.
2. `src/services/ExamService`, `src/services/PrescriptionService` – service validation/error branches remain untested.
3. Controller layer (`AppointmentController`, `AuthController`, `PrescriptionController`, `ProfessionalController`, `UserController`) – RBAC, validation, and error paths are partially covered.

### Tactical Scenarios

- **Repositories:** write tests that instantiate repository classes with a controlled sqlite connection from `setup.ts`, cover not-found cases, constraint violations, and expected data flows (list/paginate, create, update, delete). Focus on the `Uncovered Line #s` listed in coverage output.
- **ExamService / PrescriptionService:** unit tests exercising role checks, missing fields, record mismatches, and happy paths to trigger `ForbiddenError`, `ValidationError`, `ConflictError`, and `NotFoundError`.
- **AppointmentController:** add tests for each RN validation (slot availability, lead time, duplicate booking), plus RBAC and payment failure paths, ensuring coverage for exception handling and status codes.
- **AuthController / AuthService:** add tests for token validation errors, missing cookie behavior, and invalid credentials to explore unexecuted lines highlighted in coverage.
- **Middleware:** target `authMiddleware` with requests missing tokens, invalid tokens, and expired tokens, verifying all guard branches.

### Infrastructure Needs

- **setup.ts** currently resets the database. Extend it with helper factories/seeds for users, professionals, and appointments to reuse in new tests without rewriting SQL.
- **Mock utilities:** add helper functions to stub `database.getConnection()` or create disposable in-memory databases to simulate constraint failures quickly.
- **Test helpers:** expose helper `buildAuthHeaders(role)` to attach JWTs to supertest requests, making RBAC tests easier.

### Next Steps

1. Create repository-level tests covering uncovered line ranges noted above.
2. Extend service/controller tests to hit each error branch and role-based path.
3. Enhance `setup.ts` with reusable seeds/mocks and rerun `npm run coverage` to validate target reach.

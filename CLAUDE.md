# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Alpha Health Clinic is a TypeScript/Node.js REST API backend for a medical clinic management system. It handles appointments, prescriptions, exams, commissions, and multi-role user management (patients, receptionists, lab techs, health professionals, clinic admins, system admins). The project uses SQLite for storage and follows ES Modules conventions.

## Development Commands

```bash
# Install dependencies
npm install

# Run in development mode with hot reload
npm run dev

# Build for production
npm run build

# Start production server (after build)
npm start

# Run all tests
npm test

# Run tests with pattern matching (example)
npm test -- user.controller.test

# Database management
npm run db:init    # Initialize database with schema
npm run db:seed    # Seed with sample data
npm run db:reset   # Delete database file

# Other utilities
npm run email      # Test email sending functionality
```

## Architecture

### Layered Architecture Pattern

The codebase follows a classic 4-layer architecture:

1. **Routes** (`src/routes/`) - Express route definitions, parameter extraction
2. **Controllers** (`src/controller/`) - Request/response handling, calls services
3. **Services** (`src/services/`) - Business logic, validation, orchestration
4. **Repositories** (`src/repository/`) - Database queries, data access layer

Data flows: `Route → Controller → Service → Repository → Database`

### Path Aliases

TypeScript path aliases are configured in `tsconfig.json` and must use `.js` extensions in imports (ES Modules):

```typescript
import { database } from '@config/database.js';
import { UserController } from '@controllers/user.controller.js';
import { authMiddleware } from '@middlewares/auth.middleware.js';
import type { User } from '@models/user.js';
import { UserRepository } from '@repositories/user.repository.js';
import { authRoutes } from '@routes/auth.routes.js';
import { UserService } from '@services/user.service.js';
```

### Database Layer

- **Pattern**: Singleton pattern via `MedClinicDatabase` class
- **Location**: `src/config/database.ts`
- **Usage**: Import `database` singleton instance
- **Methods**:
  - `database.query<T>(sql, params)` - Returns array of rows
  - `database.queryOne<T>(sql, params)` - Returns single row or null
  - `database.run(sql, params)` - Returns `{ lastID, changes }`
- **Schema**: `src/database/schema.sql` - Comprehensive SQL with triggers, foreign keys
- **Connection**: Auto-initializes on server start, creates `database/medclinic.db`

### Authentication & Authorization

- **JWT-based**: Tokens stored in cookies or Authorization header
- **Middleware**: `authMiddleware` extracts token and sets `req.user`
- **Role-based**: `roleMiddleware(['clinic_admin', 'system_admin'])` restricts routes
- **Roles**: `patient`, `receptionist`, `lab_tech`, `health_professional`, `clinic_admin`, `system_admin`
- **Multi-tenancy**: Users belong to clinics via `clinic_id`, routes include `/:clinic_id` prefix

### Error Handling

Custom error classes in `src/utils/errors.ts`:
- `ValidationError` (400)
- `AuthError` (401)
- `ForbiddenError` (403)
- `NotFoundError` (404)
- `ConflictError` (409)

All errors are caught by `errorHandler` middleware in `src/middlewares/error.handler.ts` which standardizes JSON responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "field": "email"
  }
}
```

Throw errors from services, they propagate to the error handler automatically.

### Testing

- **Framework**: Jest with ts-jest and ESM support
- **Location**: `src/__test__/`
- **Patterns**:
  - Unit tests for services with mocked repositories
  - Integration tests for routes using `supertest`
  - Repository tests use in-memory implementations (`users-in-memory.repository.ts`)
- **Important**: Tests use `node --experimental-vm-modules` due to ESM
- **Naming**: `*.test.ts` files in `src/__test__/` directory

### Key Domains

**Users & Professionals**
- Base `users` table for all roles
- `professional_details` table extends users with specialty, CRM, pricing, commission
- Soft delete support via `deleted_at` field
- CPF/phone validation enforced by database triggers

**Appointments**
- Scheduled between patients and health professionals
- Statuses: `scheduled`, `confirmed`, `in_progress`, `completed`, `cancelled`
- Integrated with availability slots
- Email notifications via Resend API

**Prescriptions & Exams**
- Linked to appointments and professionals
- Prescriptions track medications
- Exams track lab work with file uploads

**Commissions & Transactions**
- Financial tracking for professional payments
- Commission splits between clinic and professionals
- Mock payment service (`payment-mock.service.ts`)

## Important Implementation Notes

### ES Modules
- All imports must include `.js` extension (even for `.ts` files)
- `package.json` has `"type": "module"`
- Use `import` not `require`

### Database Queries
- Always use parameterized queries: `database.run(sql, [param1, param2])`
- Never string concatenate user input into SQL
- Foreign keys are enabled via `PRAGMA foreign_keys = ON`

### Validators
- Common validators in `src/utils/validators.ts`
- Use `isValidEmail`, `isValidCpfLogic`, `isValidPassword` before database operations
- CPF sanitization: `sanitizeCpf()` removes dots and dashes

### Security
- Passwords hashed with bcrypt (10 rounds)
- JWT secret from environment variable `JWT_SECRET`
- Helmet middleware for HTTP headers
- CORS configured for `http://localhost:3001`

### Pagination
- Utility in `src/utils/pagination.ts`
- Standard format: `{ items: T[], pagination: { page, pageSize, total, totalPages } }`

## Environment Variables

See `.env.example`:
- `JWT_SECRET` - JWT signing key
- `SEED_PASS` - Password for seeded users
- `RESCHEDULE_FREE_WINDOW_HOURS` - Hours before appointment for free rescheduling
- `ENABLE_EMAIL` - Toggle email sending
- `RESEND_API_KEY` - Resend API key for emails
- `EMAIL_FROM` - Sender email address
- `EMAIL_TO` - Override recipient for testing (blank = use patient's email)

## Code Style

- Strict TypeScript enabled
- Use `type` for object shapes, `interface` for classes/extensibility
- Prefer async/await over callbacks
- Controllers are thin, business logic in services
- Repository methods are focused and single-purpose

# ADR-001: Frontend Testing Strategy — Contract Testing with MSW

**Status:** Proposed
**Date:** 2026-03-08
**Context:** Enabling reliable, self-contained testing for `approvio-frontend` and `approvio-ts-sdk` without requiring the backend

## Problem

The `approvio-frontend` and `approvio-ts-sdk` packages currently have no automated tests that exercise their HTTP interactions with the backend API. Testing these interactions today requires a fully deployed backend (NestJS + PostgreSQL + Redis + OIDC provider), which makes tests slow, flaky, and impractical for CI.

We need a testing approach that:

1. Runs entirely locally without any backend or external services
2. Validates that frontend/SDK API calls conform to the agreed API contract (OpenAPI spec)
3. Catches API drift — when the spec changes, tests must fail if mock data is outdated
4. Handles authentication bypass without real OIDC flows

## Options Considered

### Option 1: Pact (Consumer-Driven Contract Testing)

[Pact](https://pact.io/) is the industry standard for contract testing. The consumer (frontend) defines expected interactions, which are recorded as "pacts." The provider (backend) verifies it can fulfill them.

- ✅ Bi-directional verification (consumer and provider are tested independently)
- ✅ Rich ecosystem, widely adopted
- ❌ Requires a **Pact broker** (hosted service or self-hosted) to exchange contracts
- ❌ **Redundant with OpenAPI** — we already have a machine-readable contract (the OpenAPI spec). Pact is designed for cases where no formal spec exists
- ❌ Complex setup — requires both consumer and provider CI pipelines to integrate with the broker
- ❌ Pact contracts are a parallel spec definition, creating duplication and maintenance burden

### Option 2: Prism (OpenAPI Mock Server)

[Prism](https://stoplight.io/open-source/prism) spins up a local HTTP server that serves mock responses derived directly from the OpenAPI spec.

- ✅ Uses the existing OpenAPI spec directly — zero duplication
- ✅ Validates both requests and responses against the schema
- ✅ Quick setup for manual / ad-hoc testing
- ⚠️ **Limited scenario support** — can switch responses per status code via `Prefer: code=404` header, and can serve named examples via `Prefer: example=<name>`, but cannot script dynamic multi-step flows (e.g., "empty list → create → non-empty list")
- ❌ Runs as a **separate process** — tests depend on starting/stopping an external server
- ❌ Requires network communication between test and mock server (localhost, but still adds latency and setup complexity)

### Option 3: MSW (Mock Service Worker) with Typed Fixtures (Chosen)

[MSW](https://mswjs.io/) is a library (not a proxy or external service) that intercepts HTTP requests **inside the process**. In Node.js, it patches `fetch`/`http` modules. In the browser, it uses a Service Worker.

- ✅ **No external process** — runs inside the test process, zero infrastructure
- ✅ **Framework-agnostic** — intercepts `fetch` (frontend) and `axios` (SDK) identically
- ✅ **Full scenario control** — handlers are JavaScript functions with complete control over request matching, response data, status codes, headers, and per-test overrides
- ✅ **Contract enforcement via TypeScript types + fp-ts validators** — mock fixtures are typed using `@approvio/api` generated types, and validated at test-time with existing fp-ts validators
- ✅ **Browser mode** — same handlers work in Playwright E2E tests via Service Worker
- ✅ **No code changes** — `fetchWithAuth` and axios calls work as-is; MSW intercepts transparently
- ⚠️ Mock data must be manually maintained (mitigated by typed fixtures and validator tests)

### Option 4: Plain Jest/Vitest Mocks

Mock `fetch` or `axios` directly using `jest.fn()` or `vi.fn()`.

- ✅ Simple, no dependencies
- ❌ **No contract validation** — mocks are arbitrary data with no connection to the spec
- ❌ Mocks easily drift from the actual API without anyone noticing
- ❌ Tests are brittle and tightly coupled to implementation details (e.g., `jest.mock("axios")`)

## Decision

**Use Option 3: MSW with TypeScript-typed fixtures validated against `@approvio/api`.**

This approach implements a **Bi-Directional Schema Validation** strategy: the centralized OpenAPI specification in `@approvio/api` serves as the single executable source of truth, validated in both directions — the backend proves it fulfills the contract, and the consumers prove they only exercise it within its bounds. Unlike Pact (which creates a parallel consumer-driven contract), this approach reuses the spec we already have and validates it locally without any remote infrastructure.

### Rationale

1. **We already have the contract.** The OpenAPI spec → generated TypeScript types → fp-ts validators chain already exists in `@approvio/api`. Adding Pact would create a parallel contract definition with no added value.

2. **Scenario flexibility matters.** The frontend needs to test error states, empty lists, pagination, auth failures, and multi-step flows. Prism can only switch responses by status code; MSW gives full programmatic control per test.

3. **No infrastructure.** MSW runs inside the test process. No mock servers to start/stop, no brokers to host, no ports to manage.

4. **Unified across consumers.** Both `approvio-frontend` (fetch) and `approvio-ts-sdk` (axios) can use MSW identically. Shared fixtures from `@approvio/api` ensure consistency.

### Contract Drift Prevention

The strategy provides **three layers of contract enforcement**, catching drift at progressively earlier stages:

| Layer             | Mechanism                                                    | What it catches                                                    |
| ----------------- | ------------------------------------------------------------ | ------------------------------------------------------------------ |
| **Compile time**  | Fixtures typed as `User`, `Group`, etc. from `@approvio/api` | Structural mismatches — missing fields, wrong types, renamed props |
| **Test time**     | fp-ts validators verify format constraints                   | Semantic mismatches — invalid uuid, email, date-time, enum values  |
| **Build cascade** | OpenAPI spec change → `yarn generate:api` → types change     | Cross-repo drift — fixtures fail to compile against updated types  |

When the OpenAPI spec changes in `approvio-api`, the generated TypeScript types mutate. Any fixture or handler referencing outdated shapes will fail to compile in the consuming repo, making spec drift impossible to miss.

### Authentication Bypass

The frontend uses cookie-based OIDC authentication (see [ADR-001](./001-token-mediated-backend.md)). In tests:

- MSW intercepts `GET /auth/info` → returns mock user info (no real OIDC needed)
- MSW intercepts `POST /auth/web/refresh` → returns 200 (no real token refresh)
- `credentials: "include"` in `fetchWithAuth` is irrelevant since no real HTTP occurs

### Stateful Mock Scenarios

For complex multi-step flows (e.g., "empty list → create resource → list shows resource"), static MSW handlers are insufficient. The [`@mswjs/data`](https://github.com/mswjs/data) library provides an in-memory relational database that MSW handlers can read from and write to, enabling stateful test scenarios without a real backend.

This is a **future enhancement** — initial implementation uses simple per-test handler overrides, which are sufficient for the current test suite. `@mswjs/data` becomes valuable when testing complex CRUD flows in E2E tests.

### Auto-Generated Mock Handlers

Manually authoring MSW handlers introduces a maintenance risk: handlers can drift from the spec independently of fixtures. Tools such as [Orval](https://orval.dev/) and [openapi-msw](https://github.com/christoph-fricke/openapi-msw) can auto-generate MSW request handlers directly from the OpenAPI specification, ensuring handlers evolve in lockstep with the backend contract.

This is a **future improvement path** — the initial implementation uses hand-written handlers (which are straightforward for the current endpoint count). Auto-generation becomes worthwhile as the API surface grows.

### Component Placement

| Component                | Repository                                             | Rationale                                                                                                                        |
| ------------------------ | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Shared mock fixtures     | `@approvio/api`                                        | Both frontend and SDK depend on this package; fixtures are typed against generated models and validated with existing validators |
| Fixture validation tests | `@approvio/api`                                        | Ensures fixtures stay aligned with spec on every CI run                                                                          |
| MSW handlers + setup     | Each consumer (`approvio-frontend`, `approvio-ts-sdk`) | Handlers are specific to each project's test scenarios                                                                           |
| Playwright E2E config    | `approvio-frontend`                                    | Only the frontend has browser-based E2E needs                                                                                    |

### Testing Tool Stack

| Layer                    | Tool                           | Purpose                                       |
| ------------------------ | ------------------------------ | --------------------------------------------- |
| Unit / Integration tests | Vitest + React Testing Library | Component, service, and hook tests (frontend) |
| Unit tests               | Jest (existing)                | SDK tests                                     |
| API mocking              | MSW                            | Network-level interception in both repos      |
| E2E tests                | Playwright + MSW browser mode  | Full user-flow tests (frontend)               |

### CI Integration

The fully local nature of this strategy transforms the CI pipeline:

1. **On `approvio-api` spec change:** CI lints the spec, regenerates types, and publishes the package. Downstream repos (`approvio-frontend`, `approvio-ts-sdk`) pick up the new types on their next CI run — if fixtures or handlers are incompatible, the build fails immediately.
2. **On consumer repo change:** CI pulls the latest `@approvio/api` package, compiles against the current types, and runs the full Vitest / Jest + MSW suite. No backend deployment needed.
3. **Cross-repo development:** During feature work requiring simultaneous changes across repos, `yarn link` enables local binding of an uncommitted `@approvio/api` build. Types and fixtures regenerate from the local file system, allowing frontend and SDK engineers to iterate independently while remaining structurally synchronized.

## References

- [MSW — Mock Service Worker](https://mswjs.io/)
- [Vitest](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright](https://playwright.dev/)
- [Pact](https://pact.io/)
- [Prism](https://stoplight.io/open-source/prism)
- [Orval — OpenAPI to TypeScript client + MSW](https://orval.dev/)
- [`@mswjs/data` — Data modeling for MSW](https://github.com/mswjs/data)

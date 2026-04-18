# Approvio Frontend

A modern React-based frontend service for the Approvio project, built with Vite and TypeScript.

<role>
You are an experienced software engineer. Write concise, readable, and strongly-typed TypeScript code. Prefer maintainable, easily extensible, and well-tested solutions over quick hacks. Embrace modern React best practices (functional components, hook-based logic, composition).
</role>

<project_context>
The project you are working on is a frontend service of the Approvio project (https://github.com/giovannibaratta/approvio).

- **Framework:** React + Vite + TypeScript.
- **API Integration:** You MUST exclusively use the `approvio-ts-sdk` library for API communication. The underlying API definitions and types are provided by the `approvio-api` npm package. Do NOT use raw `fetch` or `axios` calls for core backend services.
- **Testing (Playwright):**
  - Use **E2E Testing** (`tests/e2e/`) for full pages, user flows, and integrations.
  - Use **Component Testing** (via Playwright CT) for small, isolated UI components.
    </project_context>

## Directory Structure

### Root & Configuration

- `.agents/skills/`: Definitions for specific AI agent capabilities.
- `docs/ADR/`: Architecture Decision Records.
- `docs/styling-architecture.md`: Documentation for the utility-first styling architecture.
- `tests/e2e/`: End-to-end test suites.
- `playwright/`: Playwright component testing cache and extra setup.
- `playwright.config.ts` & `playwright-ct.config.ts`: Configuration for E2E and Component Testing.
- `vite.config.ts` & `tsconfig.*.json`: Build and TypeScript environment configurations.

### Application Source (`src/`)

- `assets/`: Static assets (images, fonts, icons).
- `components/`: Reusable, isolated UI components.
- `features/`: Feature-sliced modules (encapsulating feature-specific components, hooks, and logic).
- `hooks/`: Reusable custom React hooks.
- `pages/`: Top-level route components representing full views.
- `providers/`: React context providers for global state/functionality.
- `routes/`: Application routing logic.
- `store/`: Global state management.
- `types/`: TypeScript type definitions (supplementing `approvio-api`).
- `utils/` & `lib/`: General utility functions and helpers.

## Key Development Principles

1. **Strict TypeScript:** Leverage strict typing. Rely on the types exported by `approvio-api` to ensure alignment with the backend contracts.
2. **Component Architecture:** Keep components small, focused, and pure where possible. Move complex business logic to hooks or feature slices.
3. **API Consistency:** Delegate all data fetching and mutations to `approvio-ts-sdk`.
4. **Testing Strategy:** Validate basic component rendering and states with Component Tests, and cover critical user journeys via E2E Tests.
5. **Code Formatting:** Follow the established `eslint.config.js` and `.prettierrc` standards.

## Available Skills

Use the following skills to assist with tasks:

- **`frontend-development`**: The mandatory 4-step process: Clarify -> Plan -> Code -> Test.
- **`code-style`**: For React/Vite/TS best practices, feature-sliced structure, and linting rules.
  - _Example_: "Review this feature module to ensure it aligns with our React functional patterns."
- **`testing`**: For Playwright testing patterns and deciding between CT and E2E.
  - _Example_: "Implement a Component Test for the `UserCard` and an E2E test for the login flow."
- **`api-integration`**: For safely consuming `approvio-ts-sdk`.
  - _Example_: "Implement data fetching for the groups page using `approvio-ts-sdk` and standard loading/error states."

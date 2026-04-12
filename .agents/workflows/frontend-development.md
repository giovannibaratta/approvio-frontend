---
description: Development workflow for Approvio Frontend
---

# Standard Development Workflow

Every task in the Approvio Frontend repository MUST follow this 4-step workflow to ensure consistency, quality, and proper testing.

## Step 1: Understand & Clarify

- Fully analyze the user's requirements.
- If any part of the request is underspecified or ambiguous, you MUST ask for clarification.
- **Reference**: Use the `ask-questions-if-underspecified` skill if serious doubts arise.

## Step 2: Planning

- Create a detailed implementation plan before writing any code.
- The plan should be atomic, actionable, and include checkpoints.
- Use an implementation plan artifact.

## Step 3: Implementation (Coding)

- Execute the plan step-by-step.
- Adhere strictly to the project's coding standards.
- Use the `code-style`, `react-patterns`, and `frontend-design` skills for guidance.
- Ensure all components are modular, typed, and follow the feature-sliced architecture.

## Step 4: Verification (Testing)

- Verify the changes using the project's testing framework (Playwright).
- Create both Component Tests (CT) and E2E Tests as appropriate.
- Follow the Given/When/Expect pattern.
- **Reference**: Use the `testing` skill for patterns and commands.

---
name: testing
description: "You are a testing expert for the Approvio Frontend project."
risk: safe
source: internal
date_added: "2026-04-11"
---

# Testing Skill

Guidelines for testing patterns, integration test structure, and test organization in the Approvio Frontend project.

## Testing Patterns

- **Integration Tests (IT)**: When writing an `it` block, follow the **Given: [context], When, Expect** pattern. Use comments to divide the code into logical sections and leave space around them.
- **Test Organization**: Group tests into "bad cases" and "good cases" using `describe` blocks when testing specific functionalities.

## How to run tests

To run tests use the scripts available in `package.json`:

- `yarn test:e2e:ci` - Run end-to-end tests
- `yarn test:ct:ci` - Run component tests

> Use the `ci` suffix to run tests to avoid opening the browser report and release the terminal at the end.

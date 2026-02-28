# Testing Skill

Guidelines for testing patterns, integration test structure, and test organization in the Approvio Frontend project.

## Testing Patterns

- **Integration Tests (IT)**: When writing an `it` block, follow the **Given: [context], When, Expect** pattern. Use comments to divide the code into logical sections and leave space around them.
- **Test Organization**: Group tests into "bad cases" and "good cases" using `describe` blocks when testing specific functionalities.

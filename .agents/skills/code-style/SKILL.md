---
name: code-style
description: "You are a code style expert for the Approvio Frontend project."
risk: safe
source: internal
date_added: "2026-04-11"
---

# Code Style Skill

Guidelines for coding standards, React-specific conventions, and file structure in the Approvio Frontend project.

## General Constraints

- **Conciseness**: Try to be as short as possible and provide additional details only if the logic is particularly complex.
- **Consistency**: Respect the existing style of the codebase.
- **Switch Statements**: Use switch exhaustiveness checks instead of adding a `default` case.
- **File Structure**: If a file contains both interfaces and classes with implementation logic, place the interfaces at the end of the file.
- **Visual Structure**: Structure code in logical sections to visually aid the reader. (Note: External formatting is applied automatically).
- **Comments**: Do not add unnecessary comments (e.g., avoid tautological comments that just restate the code).

## React Constraints

- **Component Decomposition**: Use react-patterns for guidance on component decomposition.
- **Reusability**: Prioritize creating reusable components.

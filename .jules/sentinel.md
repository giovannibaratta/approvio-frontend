## 2025-05-04 - [Update Vulnerable Dependencies]

**Vulnerability:** Outdated dependencies (`vite` and `postcss`) with known CVEs (Arbitrary File Read, Path Traversal, XSS).
**Learning:** `yarn npm audit` accurately identified vulnerabilities in the build tools.
**Prevention:** Regularly run `yarn npm audit` and update packages to secure versions.
## 2025-05-04 - [Missing Input Length Limits]
**Vulnerability:** User input forms (e.g., `GroupDetailsForm.tsx`, `WorkflowDetailsForm.tsx`) lacked length limits on text fields.
**Learning:** Without explicit `maxLength` constraints on frontend inputs, the application is exposed to potential Denial of Service (DoS) and application layer attacks from oversized payloads, even if backend validation exists.
**Prevention:** Always enforce `maxLength` on `<Input>` and `<Textarea>` components. Standard practice is 255 for names/titles and 2048 for descriptions.

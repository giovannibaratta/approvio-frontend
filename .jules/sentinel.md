## 2025-05-04 - [Update Vulnerable Dependencies]

**Vulnerability:** Outdated dependencies (`vite` and `postcss`) with known CVEs (Arbitrary File Read, Path Traversal, XSS).
**Learning:** `yarn npm audit` accurately identified vulnerabilities in the build tools.
**Prevention:** Regularly run `yarn npm audit` and update packages to secure versions.

## 2025-05-04 - [Missing Input Length Limits]

**Vulnerability:** User input forms (e.g., `GroupDetailsForm.tsx`, `WorkflowDetailsForm.tsx`) lacked length limits on text fields.
**Learning:** Without explicit `maxLength` constraints on frontend inputs, the application is exposed to potential Denial of Service (DoS) and application layer attacks from oversized payloads, even if backend validation exists.
**Prevention:** Always enforce `maxLength` on `<Input>` and `<Textarea>` components. Standard practice is 255 for names/titles and 2048 for descriptions.

## 2026-05-09 - [Input Length Limits]

**Vulnerability:** Missing input length limits on frontend input components, increasing application-layer DoS risks and potentially allowing excessively large payloads.
**Learning:** The reusable UI components (`Input` and `Textarea`) did not enforce default length limits, meaning all downstream usage was unprotected by default unless explicitly bounded.
**Prevention:** Added default `maxLength` constraints to base UI components (512 for `Input`, 5000 for `Textarea`) to enforce secure defaults while allowing explicit overrides where necessary.

## 2025-05-17 - [Add frame-ancestors to CSP]

**Vulnerability:** Missing `frame-ancestors` directive in the Content Security Policy (CSP).
**Learning:** Without `frame-ancestors 'none'`, the application could be embedded in an iframe on a malicious website, exposing users to clickjacking attacks.
**Prevention:** Always include `frame-ancestors 'none'` (or explicitly restrict it to trusted domains) as an HTTP response header, as it is strictly ignored when delivered via a `<meta>` tag according to the CSP specification.

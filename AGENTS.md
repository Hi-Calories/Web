# Hi-calories engineering role

These rules apply to the entire repository and are mandatory for every change.

## Architecture

- Keep dependencies pointing inward: presentation -> application -> domain. Infrastructure implements application/domain ports and is never imported by domain code.
- HTTP routes, Flutter widgets, and React components only validate/collect input, invoke a use case or repository contract, and render/serialize the result.
- Put external providers (AI, barcode catalogs, storage, email, push) behind typed adapters. Provider response shapes must not leak into domain models.
- Keep one responsibility per module. Split production files before they exceed roughly 400 lines unless a short comment documents why cohesion is better served by keeping them together.
- Reuse one canonical component or service for behavior shown in multiple screens. Do not copy meal detail, nutrition mapping, notification, or error handling logic.

## Correctness and safety

- Do not hardcode secrets, provider URLs, environment-specific hosts, stock image mappings, fake nutrition values, or production fallback data.
- Do not ship empty callbacks, placeholder actions, silent catches, or mock data in production paths.
- Preserve user-owned meal snapshots when library data changes. Normalize and validate all external AI/catalog data before persistence.
- Mutations that may be retried must be idempotent. Optimistic UI must include rollback or an explicit recoverable conflict state.
- Never log credentials, tokens, OTPs, image bytes, or private health data.

## Quality gate

- Every bug fix requires a regression test. Every API/schema change requires a contract test.
- Backend/Web changes must pass `npm run verify`.
- Mobile changes must pass `flutter analyze`, `flutter test`, the Web build, and the Android debug build.
- A feature is not complete while it contains an inert action, requires a manual page reload, or lacks loading, empty, offline, error, and retry states.

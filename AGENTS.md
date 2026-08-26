# Hi-calories Web engineering role

These rules apply to `https://github.com/Hi-Calories/Web`, the React/Vite Admin
application deployed by Vercel.

## Repository boundary

- This repository owns Admin presentation, query/form adapters and moderation
  workflows. It consumes only the public API from `Hi-Calories/BE`.
- Do not copy BE persistence code or Mobile UI/state into this repository.
- Work on a feature branch, merge to `develop`, then promote verified commits to
  `main`. Vercel deploys `main` from this repository.

## Architecture and safety

- Keep API calls in typed client/query modules and keep components focused on
  rendering and user interaction. Reuse shared nutrition and error components.
- Do not hardcode secrets, production hosts, stock image URLs or fake nutrition;
  use `VITE_API_URL` and approved API responses.
- Every mutation needs loading, error, retry and conflict handling. Never log
  credentials, tokens or private health data.

## Quality gate

- Every bug fix has a regression test; every API change has a contract test.
- Run `npm run verify` before merging and smoke-test the deployed Admin against
  `https://hi-calories-api.onrender.com` after a release.

# Hi-calories Web Admin

React + Vite administration console. Vercel deploys `main` from
`https://github.com/Hi-Calories/Web`.

```bash
npm ci
npm run verify
npm run dev -- --port 5173 --strictPort
```

Set `VITE_API_URL=https://hi-calories-api.onrender.com` for a deployed build.
Local development may use `http://localhost:4000`. Do not commit `.env` or
provider credentials.

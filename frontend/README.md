# SkillShare — Frontend

The client-facing web app for SkillShare, a local services marketplace. Built with **Next.js 16 (Pages Router)**, **React 19**, and **TypeScript**, styled with CSS Modules.

## Getting started

```bash
npm install
# Create .env.local from .env.example (see the repo root README for details)
npm run dev        # http://localhost:3000
```

## Useful scripts

| Command            | Purpose                              |
| ------------------ | ------------------------------------ |
| `npm run dev`      | Start the development server         |
| `npm run build`    | Create a production build            |
| `npm run start`    | Serve the production build           |
| `npm run lint`     | Run ESLint                           |
| `npx tsc --noEmit` | Type-check the codebase              |

## Structure

- `src/pages/` — routes (Pages Router): `browse`, `services/[id]`, `post-service`, `my-services`, `my-jobs`, `profile`, auth and legal pages.
- `src/components/` — Navbar, Toast, Skeleton, ConfirmDialog.
- `src/context/AuthContext.tsx` — auth state, token storage, silent refresh.
- `src/lib/api.ts` — fetch client (base URL, Bearer tokens, 401 → refresh → retry).
- `src/styles/` — CSS Modules.

See the repository-root **README.md** for full setup, architecture, API reference, and environment-variable documentation.

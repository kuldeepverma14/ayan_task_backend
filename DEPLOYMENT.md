# 🛰️ Sovereign Deployment Blueprint

This document specifies the authoritative configuration and operational steps required to deploy the RBAC Governance System to production environments (Vercel, Render, AWS, etc.).

---

## 1. Environmental Registry (Secrets)

Ensure the following variables are provisioned in your production environment.

### Backend Infrastructure
| Variable | Specification |
| :--- | :--- |
| `DATABASE_URL` | PostgreSql Connection URI (e.g., Supabase/RDS) |
| `PORT` | `8000` (or dynamically assigned by host) |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | Your production frontend URL (no trailing slash) |
| `ACCESS_TOKEN_SECRET` | High-entropy random string |
| `REFRESH_TOKEN_SECRET` | High-entropy random string |
| `ACCESS_TOKEN_EXPIRY` | `15m` |
| `REFRESH_TOKEN_EXPIRY` | `7d` |

### Frontend Console
| Variable | Specification |
| :--- | :--- |
| `VITE_API_URL` | Your production backend URL + `/api/v1` |

---

## 2. Infrastructure Build Sequences

### Backend (Node/Prisma)
- **Install Command**: `npm install`
- **Build Command**: `npx prisma generate`
- **Start Command**: `node src/index.js`
- **Initialization**: Run `node prisma/seed.js` manually after the first successful migration.

### Frontend (Vite/React)
- **Install Command**: `npm install`
- **Build Command**: `npm run build`
- **Start Command**: `npm run preview` (or host via Vercel/Netlify)

---

## 3. Production Hardening Protocol

1. **Strict CORS**: Ensure `CORS_ORIGIN` is locked to your specific production domain.
2. **Database Migrations**: Use `npx prisma migrate deploy` in your CI/CD pipeline instead of `db push` to ensure safe, additive schema updates.
3. **Session Cleansing**: The `RevokedToken` registry automatically handles logouts. Ensure your PostgreSQL instance has an automated maintenance task to purge expired revoked tokens periodically.
4. **Rate Limiting**: The system includes a global rate limiter. In production, ensure this is placed behind a proxy (like Nginx or Cloudflare) and that `app.set('trust proxy', 1)` is enabled if necessary.

---

## 4. Launch Sequence (First Run)

1. Provision Database and get `DATABASE_URL`.
2. Deploy Backend first.
3. Run `npx prisma migrate deploy`.
4. Run `node prisma/seed.js` to create the Super Admin.
5. Deploy Frontend with the backend URL configured.
6. Login as **Super Admin** and begin architectural provisioning.

---

## 🏛️ Deployment Resilience
The backend is designed as an ESM-compliant Node.js application. It is fully compatible with:
- **PaaS**: Render, Railway, Fly.io
- **Serverless**: Vercel (using the backend as an API route or separate service)
- **Containers**: Docker (standard Node:Alpine base)

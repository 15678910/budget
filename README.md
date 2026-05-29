This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Admin Authentication Setup

The admin endpoint (`POST /api/admin/auth`) uses bcrypt-hashed password verification (C4 security fix, 2026-05-29).

**Environment variable**: `ADMIN_PASSWORD_HASH` (bcrypt hash, cost=12)
The old `ADMIN_PASSWORD` (plaintext) is no longer read and must be removed from Vercel.

**Generate a new hash**:

```bash
node scripts/generate-admin-hash.js "your-secure-password-here"
```

Password requirements: minimum 12 characters.

**Vercel setup**:
1. Run the command above locally to get the hash output
2. In Vercel > Project > Settings > Environment Variables:
   - Add `ADMIN_PASSWORD_HASH` with the hash value (Production + Preview + Development)
   - Delete the old `ADMIN_PASSWORD` variable
3. Redeploy to apply

**Migration from plaintext** (`ADMIN_PASSWORD`):
- The route now exclusively reads `ADMIN_PASSWORD_HASH`. `ADMIN_PASSWORD` is silently ignored.
- If `ADMIN_PASSWORD_HASH` is not set, the endpoint returns HTTP 503.
- Failing to migrate before removing `ADMIN_PASSWORD` will lock out admin access until `ADMIN_PASSWORD_HASH` is set.


---

## 위협 모델

전체 위협 카탈로그·자산·완화 매트릭스: [docs/THREAT_MODEL.md](docs/THREAT_MODEL.md)
회귀 테스트: `tests/test_threat_scenarios.ts`

# Parking rotation web app

Parking rotation system co-authored with VS Code AI

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

## Parking configuration

Static parking data and settings live in `src/data/parking-config.json`, including the roster, availability defaults, colors, fee assumptions, and scheduling rules. Those settings are imported at build time. Runtime holiday management is backed by PostgreSQL as described below; the scheduling roster remains static.

## Backend setup

Set `DATABASE_URL` to a PostgreSQL connection string and `SESSION_TOKEN_PEPPER` to a random secret of at least 32 characters (see `.env.example`). Apply migrations with `npm run db:migrate`, then provision an admin with `npm run admin:create -- admin@example.com "Admin Name"`; the command prompts for a hidden password. For non-interactive provisioning, provide `ADMIN_INITIAL_PASSWORD` through the runtime environment. Admin passwords are hashed; session tokens are random, stored hashed in the database, and sent in an HTTP-only cookie. Keep the environment secrets server-side.

The holiday API exposes public reads at `/api/holidays`; admin-only create, update, and delete operations are available at `/api/holidays` and `/api/holidays/[id]`. Admin sign-in and management are at `/admin/login` and `/admin/holidays`. The database migration seeds the existing configured holidays as editable annual holiday records.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

Holiday storage requires a reachable PostgreSQL database. Add `DATABASE_URL` to the Vercel project's Environment Variables for each environment you deploy to, then run `npm run db:migrate` against that same database before testing `/api/holidays`. For admin sign-in and management, also configure `SESSION_TOKEN_PEPPER` as described above. Redeploy after changing environment variables. If the endpoint still returns `Holiday storage is unavailable`, check the Vercel function logs for the database error.

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

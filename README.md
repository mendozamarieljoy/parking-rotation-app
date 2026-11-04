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

Static parking data and settings live in `src/data/parking-config.json`, including the roster, availability, holidays, colors, fee assumptions, and scheduling rules. The app imports this file at build time; changes require a rebuild and redeployment. It does not provide runtime editing or backend storage.

## Reviewable parking requests

`/parking/requests` can submit swaps, blocked dates, holidays, roster changes, and scheduler rules. Each request creates a branch and pull request containing the required `parking-config.json` change. The schedule updates only after the pull request is merged and the site is redeployed.

Set these server-only deployment secrets (never prefix them with `NEXT_PUBLIC_`):

```text
GITHUB_OWNER=your-github-owner
GITHUB_REPO=your-repository-name
GITHUB_APP_ID=123456
GITHUB_APP_INSTALLATION_ID=12345678
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
```

The GitHub App requires **Contents** and **Pull requests** read/write repository permissions. `GITHUB_TOKEN` is also accepted for local development. Require pull-request approvals and enable auto-merge in the repository branch-protection rules to merge approved requests automatically. Add sign-in or another authorization check before exposing the request page outside the intended parking group.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

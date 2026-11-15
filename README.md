# Smart Education BD

A Bangla-first education platform for SSC and HSC students, built with React,
TypeScript, TanStack Start, Supabase, and Drizzle.

## Requirements

- Node.js 22.18 or newer
- npm
- A Supabase project for authentication, database, and storage

## Local setup

1. Copy `.env.example` to `.env`.
2. Set the Supabase URL and publishable key for your project. Keep the service
   role key server-only; never use a `VITE_` prefix for it.
3. Install packages and start the development server:

   ```sh
   npm install
   npm run dev
   ```

4. Open the local URL printed by Vite.

The local `.env` file is ignored by Git. Existing `.env` values are preserved
when cleaning up the project; replace them with your own Supabase settings when
moving to a different backend.

## Deploy to Vercel

1. Push the project to a Git provider and import the repository in Vercel.
2. Select **TanStack Start** as the framework preset. Use the project root as
   the root directory, `npm install` as the install command, and
   `npm run build` as the build command.
3. Add the environment variables from `.env.example` in Vercel project
   settings. `DATABASE_URL` is only needed when running Drizzle migrations;
   `CRON_AUTH_SECRET` is needed to authorize the exam reminder job. Keep
   `SUPABASE_SERVICE_ROLE_KEY` and `OPENAI_API_KEY` server-only, and never
   prefix either with `VITE_`.
4. Deploy. The Nitro Vite plugin creates the server build for Vercel.

Set the Supabase Auth site URL to your deployed domain and add the domain to
the allowed redirect URLs. Enable Google sign-in in Supabase if you use it.

## Database and migrations

Apply the SQL files in `drizzle/migrations` to your Supabase project in order.
For Drizzle commands, set `DATABASE_URL` to a direct PostgreSQL connection
string. The application uses Supabase row-level security and database functions
for protected operations.

## Other commands

```sh
npm run build
npm run preview
npm test
npm run lint
```

Google sign-in must also be enabled as an authentication provider in Supabase,
with the local application URL added to its redirect URL allowlist. AI study
help and practice plans require a configured OpenAI-compatible API key in the
server environment.

# Apartment Helper

Apartment Helper standardizes on the [Doppler CLI](https://docs.doppler.com/docs/install-cli) as the single source of truth for configuration and secrets across development, CI, and production. The scripts in this repository wrap our core workflows in `doppler run` so that every environment gets the same vetted configuration without storing credentials locally.

## Prerequisites

1. Install Node.js (version in `.nvmrc` if present, or the active LTS) and npm.
2. Install the Doppler CLI: `brew install dopplerhq/cli/doppler` (macOS) or follow the [official install guide](https://docs.doppler.com/docs/install-cli) for your platform.
3. Authenticate with Doppler using `doppler login` **or** export a long-lived service token in `DOPPLER_TOKEN`.
4. Unless you override them, the helper scripts target the following scopes:
   - `DOPPLER_PROJECT=apartment-helper`
   - `DOPPLER_CONFIG=dev` for local development and migrations.
   - `DOPPLER_CONFIG=prd` for production builds.

Override these defaults by exporting the variables before running a script.

## Local Development

Run the development server through Doppler:

```bash
npm run dev:doppler
```

`scripts/start_dev.sh` verifies that Doppler is installed, confirms your authentication for the configured project/config, and falls back to Doppler-managed values for secrets such as `DATABASE_URL` and `NEXTAUTH_SECRET` when you do not provide local overrides. Finally, the script invokes `npm run dev` via `doppler run` so all application environment variables come from Doppler.

To run the Next.js dev server without Doppler (for example in CI), you can still call `npm run dev`, but secrets will need to be provided manually.

## Database Migrations

Use the Doppler-aware migration helper to keep Prisma in sync with the configured database:

```bash
# Apply production-ready migrations (default behaviour)
npm run migrate

# Enter interactive dev workflow (prisma migrate dev)
npm run migrate dev

# Show migration status
npm run migrate status
```

`scripts/migrate.sh` compares your local overrides with Doppler. When `DATABASE_URL` is not set, it pulls the value from Doppler via `doppler secrets get` before running the Prisma command inside `doppler run`.

## Building for Release

Production and CI builds should also execute within a Doppler-managed environment:

```bash
# Uses DOPPLER_CONFIG=prd by default
npm run build:doppler
```

The build script checks your Doppler authentication and wraps `npm run build` in `doppler run --config prd`, ensuring build-time tokens (e.g. API keys) are never stored on disk or echoed into shell history. Override `DOPPLER_CONFIG` or `DOPPLER_PROJECT` to target a different scope.

## Environment Variables

All environment variables that the application consumes should be stored in Doppler. Developers can still override individual values locally (for example, by exporting `DATABASE_URL` before running a command). When an override is missing, the helper scripts query Doppler and inject the shared default automatically.

## CI and Deployment

Replicate the Doppler-first workflow in automation by calling the same helper scripts or, when a bespoke command is needed, wrapping it in `doppler run --project apartment-helper --config <env>`. This keeps your pipeline and production services aligned with local development without committing secrets to the repository.

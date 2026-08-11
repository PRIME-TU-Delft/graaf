// Stands in for SvelteKit's `$env/dynamic/private` module (aliased in vitest.config.integration.ts),
// since the integration suite runs outside the SvelteKit Vite plugin. Values come from .env.test,
// exported into the process environment by scripts/setenv.sh before vitest starts.
export const env = process.env;

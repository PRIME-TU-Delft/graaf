import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],

	test: {
		include: ['src/**/*.{test,spec}.{js,ts}', '!src/lib/server/actions/tests/**/*'],
		setupFiles: ['src/test-setup/jsdom.ts']
	},

	// Vitest otherwise still resolves packages (svelte included) through their SSR/node export
	// condition even under the jsdom environment, so component tests get the server-only build
	// of 'svelte' (no mount/unmount). The browser condition is what makes them resolve the
	// client build instead.
	resolve: process.env.VITEST ? { conditions: ['browser'] } : undefined
});

import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
	// Not the full SvelteKit plugin (hence the $lib/$env aliases below), but the Svelte one is
	// needed anyway: some server actions reach UI code transitively (GraphActions -> GraphValidator
	// -> bits-ui), and without it those .svelte imports fail to load.
	plugins: [svelte()],

	test: {
		include: ['src/lib/server/actions/tests/**/*.test.ts'],
		setupFiles: ['src/lib/server/actions/tests/helpers/setup.ts'],
		fileParallelism: false
	},
	resolve: {
		alias: {
			$lib: '/src/lib',
			'$env/dynamic/private': '/src/lib/server/actions/tests/helpers/env.ts'
		}
	}
});

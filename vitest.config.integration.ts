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
		alias: [
			{ find: '$lib', replacement: '/src/lib' },
			{
				find: '$env/dynamic/private',
				replacement: '/src/lib/server/actions/tests/helpers/env.ts'
			},
			// The action classes import setError from the sveltekit-superforms root, whose barrel
			// re-exports SuperDebug.svelte. This suite runs without the Svelte plugin, so loading that
			// barrel fails on the .svelte extension. The /server entry exports the same setError and
			// types without touching any component. Anchored so sveltekit-superforms/adapters, which
			// the test helpers need for the zod4 adapter, still resolves normally.
			{
				find: /^sveltekit-superforms$/,
				replacement: 'sveltekit-superforms/server'
			},
			// GraphActions reaches bits-ui through $lib/validators/graphValidator, which uses its
			// useId helper. Importing the bits-ui root here would pull in the whole Svelte component
			// library, which this suite cannot transform. Points at the module that actually defines
			// useId, so the validator keeps the real implementation rather than a stub.
			{
				find: /^bits-ui$/,
				replacement: '/node_modules/bits-ui/dist/internal/use-id.js'
			}
		]
	}
});

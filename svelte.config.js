import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter(),

		alias: {
			$components: 'src/lib/components',
			$styles: 'src/lib/styles',
			$assets: 'src/lib/assets',
			$scripts: 'src/lib/scripts',
			$routes: 'src/routes'
		}
	}
};

export default config;

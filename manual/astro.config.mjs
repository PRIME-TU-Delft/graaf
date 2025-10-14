// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'My Docs',
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/PRIME-TU-Delft/graaf' }
			],
			sidebar: [
				{
					label: 'Programmes',
					slug: 'programmes'
				}
			],
			customCss: [
				// Path to your Tailwind base styles:
				'./src/styles/global.css'
			]
		})
	],

	vite: {
		plugins: [tailwindcss()]
	}
});

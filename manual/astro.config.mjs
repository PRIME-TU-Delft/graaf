// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
	site: 'https://prime-tu-delft.github.io',
	base: '/graaf',
	// Astro's `redirects` targets aren't automatically prefixed with `base`, unlike other internal links.
	redirects: {
		'/': '/graaf/about'
	},
	integrations: [
		starlight({
			title: 'Graaf Manual',
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/PRIME-TU-Delft/graaf' }
			],
			sidebar: [
				{
					label: 'About',
					slug: 'about'
				},
				{
					label: 'Programmes',
					slug: 'programmes'
				},
				{
					label: 'Courses',
					slug: 'courses'
				},
				{
					label: 'Sandboxes',
					slug: 'sandboxes'
				},
				{
					label: 'Graphs',
					slug: 'graphs'
				},
				{
					label: 'Domains',
					slug: 'domains'
				},
				{
					label: 'Subjects',
					slug: 'subjects'
				},
				{
					label: 'Lectures',
					slug: 'lectures'
				},
				{
					label: 'Links',
					slug: 'links'
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

// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
	redirects: {
		'/': '/about'
	},
	integrations: [
		starlight({
			title: 'My Docs',
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

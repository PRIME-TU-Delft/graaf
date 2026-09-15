// Single source of truth for app route -> graaf manual page mapping.
// Manual source: manual/src/content/docs/*.mdx, deployed to prime-tu-delft.github.io/graaf.

const MANUAL_BASE_URL = 'https://prime-tu-delft.github.io/graaf';

const manualPagePaths = {
	about: '/about/',
	programmes: '/programmes/',
	programmeSettings: '/programmes/#editing-a-programme',
	courses: '/courses/',
	courseSettings: '/courses/#course-settings',
	sandboxes: '/sandboxes/',
	sandboxSettings: '/sandboxes/#sandbox-settings',
	graphs: '/graphs/',
	domains: '/domains/',
	subjects: '/subjects/',
	lectures: '/lectures/',
	links: '/links/'
} as const;

const manualPageLabels = {
	about: 'About',
	programmes: 'Programmes',
	programmeSettings: 'Programme settings',
	courses: 'Courses',
	courseSettings: 'Course settings',
	sandboxes: 'Sandboxes',
	sandboxSettings: 'Sandbox settings',
	graphs: 'Graphs',
	domains: 'Domains',
	subjects: 'Subjects',
	lectures: 'Lectures',
	links: 'Links'
} as const;

export type ManualPage = keyof typeof manualPagePaths;

export function manualUrl(page: ManualPage) {
	return `${MANUAL_BASE_URL}${manualPagePaths[page]}`;
}

export function manualLabel(page: ManualPage) {
	return manualPageLabels[page];
}

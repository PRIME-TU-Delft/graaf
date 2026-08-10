import prisma from '$lib/server/db/prisma';
import { GraphValidator } from '$lib/validators/graphValidator';
import type { Breadcrumb } from '$lib/utils/breadcrumbs';
import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

const leafLabels: Record<string, string> = {
	domains: 'Domains',
	subjects: 'Subjects',
	lectures: 'Lectures'
};

export const load: LayoutServerLoad = async ({ params, url }) => {
	if (!params.graphid) {
		error(400, { message: 'Graph ID is required' });
	}

	const graphId = parseInt(params.graphid);
	// Check if graphId is not NaN
	if (isNaN(graphId)) {
		error(400, { message: 'Graph id must be a number' });
	}

	try {
		const graph = await prisma.graph.findFirst({
			where: {
				id: graphId
			},
			include: {
				course: { select: { code: true } },
				sandbox: { select: { id: true, name: true } },
				domains: {
					include: {
						sourceDomains: true,
						targetDomains: true
					},
					orderBy: {
						order: 'asc'
					}
				},
				subjects: {
					include: {
						sourceSubjects: true,
						targetSubjects: true,
						domain: true
					},
					orderBy: {
						order: 'asc'
					}
				},
				lectures: {
					include: {
						subjects: true
					},
					orderBy: {
						order: 'asc'
					}
				}
			}
		});

		if (!graph) error(404, { message: 'Graph not found' });

		const graphValidator = new GraphValidator(graph);
		const issues = graphValidator.validate();

		// Build the breadcrumb trail from the graph's real parent (course or sandbox) and the
		// active leaf tab, so the nav bar shows names instead of guessing from the URL path.
		const breadcrumbs: Breadcrumb[] = [{ name: 'Home', url: '/graph-editor' }];
		if (graph.parentType === 'COURSE' && graph.course) {
			breadcrumbs.push({ name: 'Courses', url: '/graph-editor/courses' });
			breadcrumbs.push({
				name: graph.course.code,
				url: `/graph-editor/courses/${graph.course.code}`
			});
		} else if (graph.sandbox) {
			breadcrumbs.push({ name: 'Sandboxes', url: '/graph-editor/sandboxes' });
			breadcrumbs.push({
				name: graph.sandbox.name,
				url: `/graph-editor/sandboxes/${graph.sandbox.id}`
			});
		}
		breadcrumbs.push({ name: graph.name, url: `/graph-editor/graphs/${graph.id}` });

		const leaf = url.pathname.split('/').filter(Boolean).at(-1);
		if (leaf && leaf in leafLabels) {
			breadcrumbs.push({ name: leafLabels[leaf], url: `/graph-editor/graphs/${graph.id}/${leaf}` });
		}

		// Happy path
		return {
			graph: graph,
			issues: issues,
			breadcrumbs
		};
	} catch (e: unknown) {
		error(500, { message: e instanceof Error ? e.message : `${e}` });
	}
};

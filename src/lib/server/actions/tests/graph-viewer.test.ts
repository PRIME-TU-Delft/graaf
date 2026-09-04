import { beforeEach, describe, expect, it } from 'vitest';

import { GraphActions } from '$lib/server/actions/Graphs';

import {
	FIXTURE_COURSES,
	FIXTURE_GRAPHS,
	createCourseLink,
	createSandbox,
	createSandboxGraph,
	createSandboxLink,
	fixtureUsers,
	getCourse,
	getGraph,
	seedFixture
} from './helpers/fixture';

// Mirrors the query shape src/routes/graph/[code]/[alias]/+page.server.ts runs: a course lookup
// first, falling back to a sandbox lookup by the same code/alias pair only when the course lookup
// comes back empty (#184).

beforeEach(seedFixture);

describe('the public graph-viewer lookup', () => {
	it('resolves a sandbox link by sandbox uriCode and link name', async () => {
		const { courseAdmin } = await fixtureUsers();
		const sandbox = await createSandbox(courseAdmin.id, [], 'ViewerSandbox', 'viewer-sandbox');
		const graph = await createSandboxGraph(sandbox.id, 'ViewerGraph');
		await createSandboxLink(sandbox.id, graph.id, 'viewer-alias');

		const found = await GraphActions.getRenderablePayload({
			course: { uriCode: 'viewer-sandbox' },
			links: { some: { name: 'viewer-alias' } }
		});
		expect(found).toBeNull();

		const foundViaSandboxFallback = await GraphActions.getRenderablePayload({
			sandbox: { uriCode: 'viewer-sandbox' },
			links: { some: { name: 'viewer-alias' } }
		});
		expect(foundViaSandboxFallback).not.toBeNull();
		expect(foundViaSandboxFallback?.id).toBe(graph.id);
	});

	it('lets a course code win over a sandbox code with the same value', async () => {
		const { courseAdmin } = await fixtureUsers();
		const courseOne = await getCourse(FIXTURE_COURSES.one.code);
		const graphOne = await getGraph(FIXTURE_GRAPHS.one);
		await createCourseLink(courseOne.id, graphOne.id, 'graph-one');

		// A sandbox sharing the course's uriCode, with a link of the same name, should never be
		// reachable through it: the course lookup finds a match first and the sandbox is never tried.
		const sandbox = await createSandbox(
			courseAdmin.id,
			[],
			'CollidingSandbox',
			FIXTURE_COURSES.one.uriCode
		);
		const sandboxGraph = await createSandboxGraph(sandbox.id, 'CollidingGraph');
		await createSandboxLink(sandbox.id, sandboxGraph.id, 'graph-one');

		const courseLookup = await GraphActions.getRenderablePayload({
			course: { uriCode: FIXTURE_COURSES.one.uriCode },
			links: { some: { name: 'graph-one' } }
		});

		expect(courseLookup).not.toBeNull();
		expect(courseLookup?.id).toBe(graphOne.id);
	});

	it('returns null for an unknown code or a known code with an unknown alias', async () => {
		await expect(
			GraphActions.getRenderablePayload({
				course: { uriCode: 'does-not-exist' },
				links: { some: { name: 'anything' } }
			})
		).resolves.toBeNull();

		await expect(
			GraphActions.getRenderablePayload({
				course: { uriCode: FIXTURE_COURSES.one.uriCode },
				links: { some: { name: 'no-such-alias' } }
			})
		).resolves.toBeNull();
	});
});

import { beforeEach, describe, expect, it } from 'vitest';

import prisma from '$lib/server/db/prisma';
import { LinkActions } from '$lib/server/actions/Links';
import { editLinkSchema, newLinkSchema } from '$lib/zod/linkSchema';

import {
	FIXTURE_COURSES,
	FIXTURE_GRAPHS,
	createCourseLink,
	createOutsider,
	createSandbox,
	createSandboxGraph,
	createSandboxLink,
	fixtureUsers,
	getCourse,
	getGraph,
	seedFixture
} from './helpers/fixture';
import { buildForm, expectDenied } from './helpers/actions';

// Same dual-branch shape as GraphActions: COURSE gated at CourseAdminEditorORProgramAdminEditor,
// SANDBOX at OwnerOREditor with no super-admin bypass.
//
// Denials assert status and an unchanged database rather than message text, because
// withPermissionCheck currently emits a raw Prisma error instead of its message (#153).

beforeEach(seedFixture);

async function sandboxSetup() {
	const users = await fixtureUsers();
	const sandbox = await createSandbox(users.courseAdmin.id, [users.courseEditor.id]);
	const graph = await createSandboxGraph(sandbox.id);

	return { ...users, sandbox, graph };
}

describe('LinkActions.newLink', () => {
	it('allows a course editor on the COURSE branch', async () => {
		const { courseEditor } = await fixtureUsers();
		const course = await getCourse(FIXTURE_COURSES.three.code);
		const graph = await getGraph(FIXTURE_GRAPHS.three);

		const form = await buildForm(newLinkSchema, {
			parentId: course.id,
			parentType: 'COURSE',
			graphId: graph.id,
			name: 'new-link'
		});
		const result = await LinkActions.newLink(courseEditor, form);

		expect(result).not.toHaveProperty('status');
		await expect(prisma.link.findFirst({ where: { name: 'new-link' } })).resolves.not.toBeNull();
	});

	it('denies a user with no role on the course', async () => {
		const outsider = await createOutsider();
		const course = await getCourse(FIXTURE_COURSES.three.code);
		const graph = await getGraph(FIXTURE_GRAPHS.three);

		const form = await buildForm(newLinkSchema, {
			parentId: course.id,
			parentType: 'COURSE',
			graphId: graph.id,
			name: 'new-link'
		});
		const result = await LinkActions.newLink(outsider, form);

		expectDenied(result);
		await expect(prisma.link.findFirst({ where: { name: 'new-link' } })).resolves.toBeNull();
	});

	it('allows a sandbox editor on the SANDBOX branch', async () => {
		const { courseEditor, sandbox, graph } = await sandboxSetup();

		const form = await buildForm(newLinkSchema, {
			parentId: sandbox.id,
			parentType: 'SANDBOX',
			graphId: graph.id,
			name: 'sb-new-link'
		});
		const result = await LinkActions.newLink(courseEditor, form);

		expect(result).not.toHaveProperty('status');
		await expect(prisma.link.findFirst({ where: { name: 'sb-new-link' } })).resolves.not.toBeNull();
	});

	it('denies a super admin on the SANDBOX branch', async () => {
		const { superAdmin, sandbox, graph } = await sandboxSetup();

		const form = await buildForm(newLinkSchema, {
			parentId: sandbox.id,
			parentType: 'SANDBOX',
			graphId: graph.id,
			name: 'sb-new-link'
		});
		const result = await LinkActions.newLink(superAdmin, form);

		expectDenied(result);
		await expect(prisma.link.findFirst({ where: { name: 'sb-new-link' } })).resolves.toBeNull();
	});
});

describe('LinkActions.moveLink', () => {
	it('allows a course editor to repoint a link', async () => {
		const { courseEditor } = await fixtureUsers();
		const course = await getCourse(FIXTURE_COURSES.three.code);
		const graphThree = await getGraph(FIXTURE_GRAPHS.three);
		const graphOne = await getGraph(FIXTURE_GRAPHS.one);
		const link = await createCourseLink(course.id, graphThree.id);

		const form = await buildForm(editLinkSchema, {
			parentId: course.id,
			parentType: 'COURSE',
			graphId: graphOne.id,
			linkId: link.id
		});
		const result = await LinkActions.moveLink(courseEditor, form);

		expect(result).not.toHaveProperty('status');
		await expect(prisma.link.findUniqueOrThrow({ where: { id: link.id } })).resolves.toMatchObject({
			graphId: graphOne.id
		});
	});

	it('denies a user with no role and leaves the link pointing where it was', async () => {
		const outsider = await createOutsider();
		const course = await getCourse(FIXTURE_COURSES.three.code);
		const graphThree = await getGraph(FIXTURE_GRAPHS.three);
		const graphOne = await getGraph(FIXTURE_GRAPHS.one);
		const link = await createCourseLink(course.id, graphThree.id);

		const form = await buildForm(editLinkSchema, {
			parentId: course.id,
			parentType: 'COURSE',
			graphId: graphOne.id,
			linkId: link.id
		});
		const result = await LinkActions.moveLink(outsider, form);

		expectDenied(result);
		await expect(prisma.link.findUniqueOrThrow({ where: { id: link.id } })).resolves.toMatchObject({
			graphId: graphThree.id
		});
	});

	it('denies a super admin on the SANDBOX branch', async () => {
		const { superAdmin, sandbox, graph } = await sandboxSetup();
		const otherGraph = await createSandboxGraph(sandbox.id, 'OtherSandboxGraph');
		const link = await createSandboxLink(sandbox.id, graph.id);

		const form = await buildForm(editLinkSchema, {
			parentId: sandbox.id,
			parentType: 'SANDBOX',
			graphId: otherGraph.id,
			linkId: link.id
		});
		const result = await LinkActions.moveLink(superAdmin, form);

		expectDenied(result);
		await expect(prisma.link.findUniqueOrThrow({ where: { id: link.id } })).resolves.toMatchObject({
			graphId: graph.id
		});
	});
});

describe('LinkActions.deleteLink', () => {
	it('allows a course editor', async () => {
		const { courseEditor } = await fixtureUsers();
		const course = await getCourse(FIXTURE_COURSES.three.code);
		const graph = await getGraph(FIXTURE_GRAPHS.three);
		const link = await createCourseLink(course.id, graph.id);

		const form = await buildForm(editLinkSchema, {
			parentId: course.id,
			parentType: 'COURSE',
			graphId: graph.id,
			linkId: link.id
		});
		const result = await LinkActions.deleteLink(courseEditor, form);

		expect(result).not.toHaveProperty('status');
		await expect(prisma.link.findUnique({ where: { id: link.id } })).resolves.toBeNull();
	});

	it('denies a user with no role and keeps the link', async () => {
		const outsider = await createOutsider();
		const course = await getCourse(FIXTURE_COURSES.three.code);
		const graph = await getGraph(FIXTURE_GRAPHS.three);
		const link = await createCourseLink(course.id, graph.id);

		const form = await buildForm(editLinkSchema, {
			parentId: course.id,
			parentType: 'COURSE',
			graphId: graph.id,
			linkId: link.id
		});
		const result = await LinkActions.deleteLink(outsider, form);

		expectDenied(result);
		await expect(prisma.link.findUnique({ where: { id: link.id } })).resolves.not.toBeNull();
	});

	it('allows the sandbox owner on the SANDBOX branch', async () => {
		const { courseAdmin, sandbox, graph } = await sandboxSetup();
		const link = await createSandboxLink(sandbox.id, graph.id);

		const form = await buildForm(editLinkSchema, {
			parentId: sandbox.id,
			parentType: 'SANDBOX',
			graphId: graph.id,
			linkId: link.id
		});
		const result = await LinkActions.deleteLink(courseAdmin, form);

		expect(result).not.toHaveProperty('status');
		await expect(prisma.link.findUnique({ where: { id: link.id } })).resolves.toBeNull();
	});

	it('denies a non-member on the SANDBOX branch', async () => {
		const { sandbox, graph } = await sandboxSetup();
		const outsider = await createOutsider();
		const link = await createSandboxLink(sandbox.id, graph.id);

		const form = await buildForm(editLinkSchema, {
			parentId: sandbox.id,
			parentType: 'SANDBOX',
			graphId: graph.id,
			linkId: link.id
		});
		const result = await LinkActions.deleteLink(outsider, form);

		expectDenied(result);
		await expect(prisma.link.findUnique({ where: { id: link.id } })).resolves.not.toBeNull();
	});
});

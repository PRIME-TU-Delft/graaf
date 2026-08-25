import { beforeEach, describe, expect, it } from 'vitest';
import { isRedirect } from '@sveltejs/kit';

import prisma from '$lib/server/db/prisma';
import { GraphActions } from '$lib/server/actions/Graphs';
import { duplicateGraphSchema, graphSchemaWithId, newGraphSchema } from '$lib/zod/graphSchema';

import {
	FIXTURE_COURSES,
	FIXTURE_GRAPHS,
	createOutsider,
	createSandbox,
	createSandboxGraph,
	fixtureUsers,
	getCourse,
	getGraph,
	seedFixture
} from './helpers/fixture';
import { buildForm, errorMessages, expectDenied } from './helpers/actions';

// Every method here branches on parentType. The COURSE branch is gated at
// CourseAdminEditorORProgramAdminEditor, the SANDBOX branch at OwnerOREditor. The two behave
// differently for super admins, which is what the sandbox cases below pin down.
//
// The `parentType` fall-through (returning undefined when it is neither COURSE nor SANDBOX) is not
// reachable through these entry points: the zod enum rejects any other value first, so the method
// returns a form error rather than falling through.
//
// Denials that run through withPermissionCheck assert status and an unchanged database, not
// message text, because that helper currently emits a raw Prisma error instead (#153).

beforeEach(seedFixture);

/** Sandbox owned by the course admin, edited by the course editor, seen by nobody else. */
async function sandboxSetup() {
	const users = await fixtureUsers();
	const sandbox = await createSandbox(users.courseAdmin.id, [users.courseEditor.id]);

	return { ...users, sandbox };
}

describe('GraphActions.newGraph (COURSE)', () => {
	it('allows a course editor', async () => {
		const { courseEditor } = await fixtureUsers();
		const course = await getCourse(FIXTURE_COURSES.three.code);

		const form = await buildForm(newGraphSchema, {
			parentId: course.id,
			parentType: 'COURSE',
			name: 'NewCourseGraph'
		});
		const result = await GraphActions.newGraph(courseEditor, form);

		expect(result).not.toHaveProperty('status');
		await expect(
			prisma.graph.findFirst({ where: { name: 'NewCourseGraph' } })
		).resolves.not.toBeNull();
	});

	it('denies a user with no role on the course', async () => {
		const outsider = await createOutsider();
		const course = await getCourse(FIXTURE_COURSES.three.code);

		const form = await buildForm(newGraphSchema, {
			parentId: course.id,
			parentType: 'COURSE',
			name: 'NewCourseGraph'
		});
		const result = await GraphActions.newGraph(outsider, form);

		expectDenied(result);
		await expect(prisma.graph.findFirst({ where: { name: 'NewCourseGraph' } })).resolves.toBeNull();
	});
});

describe('GraphActions.newGraph (SANDBOX)', () => {
	it('allows a sandbox editor', async () => {
		const { courseEditor, sandbox } = await sandboxSetup();

		const form = await buildForm(newGraphSchema, {
			parentId: sandbox.id,
			parentType: 'SANDBOX',
			name: 'NewSandboxGraph'
		});
		const result = await GraphActions.newGraph(courseEditor, form);

		expect(result).not.toHaveProperty('status');
		await expect(
			prisma.graph.findFirst({ where: { name: 'NewSandboxGraph' } })
		).resolves.not.toBeNull();
	});

	it('denies a super admin, who gets no implicit sandbox access', async () => {
		// whereHasSandboxPermission is the one permission helper with no role === 'ADMIN' bypass, so
		// a super admin who is neither owner nor editor is refused here even though the same user
		// may edit any course or program in the system.
		const { superAdmin, sandbox } = await sandboxSetup();

		const form = await buildForm(newGraphSchema, {
			parentId: sandbox.id,
			parentType: 'SANDBOX',
			name: 'NewSandboxGraph'
		});
		const result = await GraphActions.newGraph(superAdmin, form);

		expectDenied(result);
		await expect(
			prisma.graph.findFirst({ where: { name: 'NewSandboxGraph' } })
		).resolves.toBeNull();
	});
});

describe('GraphActions.editGraph', () => {
	it('allows a course editor on the COURSE branch', async () => {
		const { courseEditor } = await fixtureUsers();
		const course = await getCourse(FIXTURE_COURSES.three.code);
		const graph = await getGraph(FIXTURE_GRAPHS.three);

		const form = await buildForm(graphSchemaWithId, {
			parentId: course.id,
			parentType: 'COURSE',
			graphId: graph.id,
			name: 'RenamedGraph'
		});
		const result = await GraphActions.editGraph(courseEditor, form);

		expect(result).not.toHaveProperty('status');
		await expect(
			prisma.graph.findUniqueOrThrow({ where: { id: graph.id } })
		).resolves.toMatchObject({ name: 'RenamedGraph' });
	});

	it('denies a user with no role and keeps the graph name', async () => {
		const outsider = await createOutsider();
		const course = await getCourse(FIXTURE_COURSES.three.code);
		const graph = await getGraph(FIXTURE_GRAPHS.three);

		const form = await buildForm(graphSchemaWithId, {
			parentId: course.id,
			parentType: 'COURSE',
			graphId: graph.id,
			name: 'RenamedGraph'
		});
		const result = await GraphActions.editGraph(outsider, form);

		expectDenied(result);
		await expect(
			prisma.graph.findUniqueOrThrow({ where: { id: graph.id } })
		).resolves.toMatchObject({ name: FIXTURE_GRAPHS.three });
	});

	it('allows the sandbox owner on the SANDBOX branch', async () => {
		const { courseAdmin, sandbox } = await sandboxSetup();
		const graph = await createSandboxGraph(sandbox.id);

		const form = await buildForm(graphSchemaWithId, {
			parentId: sandbox.id,
			parentType: 'SANDBOX',
			graphId: graph.id,
			name: 'RenamedSandboxGraph'
		});
		const result = await GraphActions.editGraph(courseAdmin, form);

		expect(result).not.toHaveProperty('status');
		await expect(
			prisma.graph.findUniqueOrThrow({ where: { id: graph.id } })
		).resolves.toMatchObject({ name: 'RenamedSandboxGraph' });
	});

	it('denies a non-member on the SANDBOX branch', async () => {
		const { sandbox } = await sandboxSetup();
		const outsider = await createOutsider();
		const graph = await createSandboxGraph(sandbox.id);

		const form = await buildForm(graphSchemaWithId, {
			parentId: sandbox.id,
			parentType: 'SANDBOX',
			graphId: graph.id,
			name: 'RenamedSandboxGraph'
		});
		const result = await GraphActions.editGraph(outsider, form);

		expectDenied(result);
		await expect(
			prisma.graph.findUniqueOrThrow({ where: { id: graph.id } })
		).resolves.toMatchObject({ name: 'SandboxGraph' });
	});
});

describe('GraphActions.deleteGraph', () => {
	it('allows a course editor on the COURSE branch', async () => {
		const { courseEditor } = await fixtureUsers();
		const course = await getCourse(FIXTURE_COURSES.three.code);
		const graph = await getGraph(FIXTURE_GRAPHS.three);

		const form = await buildForm(graphSchemaWithId, {
			parentId: course.id,
			parentType: 'COURSE',
			graphId: graph.id,
			name: FIXTURE_GRAPHS.three
		});
		const result = await GraphActions.deleteGraph(courseEditor, form);

		expect(result).not.toHaveProperty('status');
		await expect(prisma.graph.findUnique({ where: { id: graph.id } })).resolves.toBeNull();
	});

	it('denies a user with no role and keeps the graph', async () => {
		const outsider = await createOutsider();
		const course = await getCourse(FIXTURE_COURSES.three.code);
		const graph = await getGraph(FIXTURE_GRAPHS.three);

		const form = await buildForm(graphSchemaWithId, {
			parentId: course.id,
			parentType: 'COURSE',
			graphId: graph.id,
			name: FIXTURE_GRAPHS.three
		});
		const result = await GraphActions.deleteGraph(outsider, form);

		expectDenied(result);
		await expect(prisma.graph.findUnique({ where: { id: graph.id } })).resolves.not.toBeNull();
	});

	it('denies a super admin on the SANDBOX branch', async () => {
		const { superAdmin, sandbox } = await sandboxSetup();
		const graph = await createSandboxGraph(sandbox.id);

		const form = await buildForm(graphSchemaWithId, {
			parentId: sandbox.id,
			parentType: 'SANDBOX',
			graphId: graph.id,
			name: 'SandboxGraph'
		});
		const result = await GraphActions.deleteGraph(superAdmin, form);

		expectDenied(result);
		await expect(prisma.graph.findUnique({ where: { id: graph.id } })).resolves.not.toBeNull();
	});
});

describe('GraphActions.duplicateGraph', () => {
	it('denies a caller with no rights on the destination course', async () => {
		const outsider = await createOutsider();
		const source = await getGraph(FIXTURE_GRAPHS.one);
		const destination = await getCourse(FIXTURE_COURSES.three.code);

		const form = await buildForm(duplicateGraphSchema, {
			graphId: source.id,
			newName: 'CopiedGraph',
			destinationType: 'COURSE',
			destinationId: destination.id
		});
		const result = await GraphActions.duplicateGraph(outsider, form);

		expect(errorMessages(result)).toContain(
			'Destination course not found or you do not have access to it'
		);
		await expect(prisma.graph.findFirst({ where: { name: 'CopiedGraph' } })).resolves.toBeNull();
	});

	it('denies a super admin whose destination is a sandbox they do not belong to', async () => {
		const { superAdmin, sandbox } = await sandboxSetup();
		const source = await getGraph(FIXTURE_GRAPHS.one);

		const form = await buildForm(duplicateGraphSchema, {
			graphId: source.id,
			newName: 'CopiedGraph',
			destinationType: 'SANDBOX',
			destinationId: sandbox.id
		});
		const result = await GraphActions.duplicateGraph(superAdmin, form);

		expect(errorMessages(result)).toContain(
			'Destination sandbox not found or you do not have access to it'
		);
		await expect(prisma.graph.findFirst({ where: { name: 'CopiedGraph' } })).resolves.toBeNull();
	});

	it('denies duplicating a source graph the caller has no access to, which is bug #151', async () => {
		const { courseEditor } = await fixtureUsers();
		const sandbox = await createSandbox(courseEditor.id);
		const source = await getGraph(FIXTURE_GRAPHS.one);

		const form = await buildForm(duplicateGraphSchema, {
			graphId: source.id,
			newName: 'CopiedGraph',
			destinationType: 'SANDBOX',
			destinationId: sandbox.id
		});
		const result = await GraphActions.duplicateGraph(courseEditor, form);

		expect(errorMessages(result)).toContain('Source graph not found');
		await expect(prisma.graph.findFirst({ where: { name: 'CopiedGraph' } })).resolves.toBeNull();
	});

	it('copies a source graph the caller has course editor access to', async () => {
		const { courseEditor } = await fixtureUsers();
		const sandbox = await createSandbox(courseEditor.id);
		const source = await getGraph(FIXTURE_GRAPHS.three);

		const form = await buildForm(duplicateGraphSchema, {
			graphId: source.id,
			newName: 'CopiedGraph',
			destinationType: 'SANDBOX',
			destinationId: sandbox.id
		});
		// Succeeds by throwing a redirect to the destination, which is the tell that the copy ran.
		await expect(GraphActions.duplicateGraph(courseEditor, form)).rejects.toSatisfy(isRedirect);

		const copied = await prisma.graph.findFirst({
			where: { name: 'CopiedGraph' },
			include: { domains: true, subjects: true }
		});
		expect(copied).not.toBeNull();
		expect(copied?.domains).toHaveLength(3);
		expect(copied?.subjects).toHaveLength(3);
	});

	it('copies a source graph in a sandbox the caller owns', async () => {
		const { courseEditor } = await fixtureUsers();
		const sourceSandbox = await createSandbox(courseEditor.id);
		const source = await createSandboxGraph(sourceSandbox.id);
		const destSandbox = await createSandbox(courseEditor.id);

		const form = await buildForm(duplicateGraphSchema, {
			graphId: source.id,
			newName: 'CopiedFromSandbox',
			destinationType: 'SANDBOX',
			destinationId: destSandbox.id
		});
		await expect(GraphActions.duplicateGraph(courseEditor, form)).rejects.toSatisfy(isRedirect);

		await expect(
			prisma.graph.findFirst({ where: { name: 'CopiedFromSandbox' } })
		).resolves.not.toBeNull();
	});

	it('denies duplicating a source graph in a sandbox the caller has no access to', async () => {
		const { sandbox } = await sandboxSetup();
		const source = await createSandboxGraph(sandbox.id);
		const outsider = await createOutsider();
		const destSandbox = await createSandbox(outsider.id);

		const form = await buildForm(duplicateGraphSchema, {
			graphId: source.id,
			newName: 'CopiedGraph',
			destinationType: 'SANDBOX',
			destinationId: destSandbox.id
		});
		const result = await GraphActions.duplicateGraph(outsider, form);

		expect(errorMessages(result)).toContain('Source graph not found');
		await expect(prisma.graph.findFirst({ where: { name: 'CopiedGraph' } })).resolves.toBeNull();
	});
});

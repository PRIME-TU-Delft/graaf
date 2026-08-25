import { beforeEach, describe, expect, it } from 'vitest';
import { isRedirect } from '@sveltejs/kit';

import prisma from '$lib/server/db/prisma';
import { SandboxActions } from '$lib/server/actions/Sandboxes';
import {
	deleteSandboxSchema,
	editSandboxSchema,
	editSuperUserSchema,
	leaveSandboxSchema
} from '$lib/zod/sandboxSchema';

import { createOutsider, createSandbox, fixtureUsers, seedFixture } from './helpers/fixture';
import { buildForm, errorMessages, expectDenied } from './helpers/actions';

// Sandboxes are the exception to the permission model used everywhere else:
// whereHasSandboxPermission has no role === 'ADMIN' short circuit, so a super admin who is neither
// owner nor editor is refused, unlike in every course-scoped or program-scoped action. Several
// tests below use the fixture super admin specifically as the denied party.
//
// editSandbox, editSuperUser, and deleteSandbox all require 'Owner', so a sandbox editor is the
// natural one-tier-below denial for them.
//
// SandboxActions.newSandbox is deliberately not covered: it has no permission gate, any
// authenticated user may create a sandbox and is forced to be its owner.

beforeEach(seedFixture);

/** Sandbox owned by the course admin, edited by the course editor. */
async function sandboxSetup() {
	const users = await fixtureUsers();
	const sandbox = await createSandbox(users.courseAdmin.id, [users.courseEditor.id]);

	return { ...users, sandbox };
}

describe('SandboxActions.editSandbox', () => {
	it('allows the owner', async () => {
		const { courseAdmin, sandbox } = await sandboxSetup();

		const form = await buildForm(editSandboxSchema, {
			sandboxId: sandbox.id,
			name: 'RenamedSandbox'
		});
		const result = await SandboxActions.editSandbox(courseAdmin, form);

		expect(result).not.toHaveProperty('status');
		await expect(
			prisma.sandbox.findUniqueOrThrow({ where: { id: sandbox.id } })
		).resolves.toMatchObject({ name: 'RenamedSandbox' });
	});

	it('denies an editor, since this requires the owner tier', async () => {
		const { courseEditor, sandbox } = await sandboxSetup();

		const form = await buildForm(editSandboxSchema, {
			sandboxId: sandbox.id,
			name: 'RenamedSandbox'
		});
		const result = await SandboxActions.editSandbox(courseEditor, form);

		expectDenied(result);
		await expect(
			prisma.sandbox.findUniqueOrThrow({ where: { id: sandbox.id } })
		).resolves.toMatchObject({ name: 'Sandbox' });
	});

	it('denies a super admin, who gets no implicit sandbox access', async () => {
		const { superAdmin, sandbox } = await sandboxSetup();

		const form = await buildForm(editSandboxSchema, {
			sandboxId: sandbox.id,
			name: 'RenamedSandbox'
		});
		const result = await SandboxActions.editSandbox(superAdmin, form);

		expectDenied(result);
		await expect(
			prisma.sandbox.findUniqueOrThrow({ where: { id: sandbox.id } })
		).resolves.toMatchObject({ name: 'Sandbox' });
	});
});

describe('SandboxActions.deleteSandbox', () => {
	it('allows the owner, redirecting on success', async () => {
		const { courseAdmin, sandbox } = await sandboxSetup();

		const form = await buildForm(deleteSandboxSchema, { sandboxId: sandbox.id });
		await expect(SandboxActions.deleteSandbox(courseAdmin, form)).rejects.toSatisfy(isRedirect);

		await expect(prisma.sandbox.findUnique({ where: { id: sandbox.id } })).resolves.toBeNull();
	});

	it('denies an editor and keeps the sandbox', async () => {
		const { courseEditor, sandbox } = await sandboxSetup();

		const form = await buildForm(deleteSandboxSchema, { sandboxId: sandbox.id });
		const result = await SandboxActions.deleteSandbox(courseEditor, form);

		expectDenied(result);
		await expect(prisma.sandbox.findUnique({ where: { id: sandbox.id } })).resolves.not.toBeNull();
	});

	it('denies a super admin and keeps the sandbox', async () => {
		const { superAdmin, sandbox } = await sandboxSetup();

		const form = await buildForm(deleteSandboxSchema, { sandboxId: sandbox.id });
		const result = await SandboxActions.deleteSandbox(superAdmin, form);

		expectDenied(result);
		await expect(prisma.sandbox.findUnique({ where: { id: sandbox.id } })).resolves.not.toBeNull();
	});
});

describe('SandboxActions.editSuperUser', () => {
	// Hand-rolled failure paths, so the messages here are reliable.

	it('allows the owner to add an editor', async () => {
		const { courseAdmin, sandbox } = await sandboxSetup();
		const outsider = await createOutsider();

		const form = await buildForm(editSuperUserSchema, {
			sandboxId: sandbox.id,
			userId: outsider.id,
			role: 'editor'
		});
		const result = await SandboxActions.editSuperUser(courseAdmin, form);

		expect(result).not.toHaveProperty('status');
		const after = await prisma.sandbox.findUniqueOrThrow({
			where: { id: sandbox.id },
			include: { editors: true }
		});
		expect(after.editors.map((e) => e.id)).toContain(outsider.id);
	});

	it('denies an editor trying to add another editor', async () => {
		const { courseEditor, sandbox } = await sandboxSetup();
		const outsider = await createOutsider();

		const form = await buildForm(editSuperUserSchema, {
			sandboxId: sandbox.id,
			userId: outsider.id,
			role: 'editor'
		});
		const result = await SandboxActions.editSuperUser(courseEditor, form);

		expect(errorMessages(result)).toContain("You don't have permission to edit this sandbox");
		const after = await prisma.sandbox.findUniqueOrThrow({
			where: { id: sandbox.id },
			include: { editors: true }
		});
		expect(after.editors.map((e) => e.id)).not.toContain(outsider.id);
	});

	it('denies a super admin', async () => {
		const { superAdmin, sandbox } = await sandboxSetup();
		const outsider = await createOutsider();

		const form = await buildForm(editSuperUserSchema, {
			sandboxId: sandbox.id,
			userId: outsider.id,
			role: 'editor'
		});
		const result = await SandboxActions.editSuperUser(superAdmin, form);

		expect(errorMessages(result)).toContain("You don't have permission to edit this sandbox");
		const after = await prisma.sandbox.findUniqueOrThrow({
			where: { id: sandbox.id },
			include: { editors: true }
		});
		expect(after.editors.map((e) => e.id)).not.toContain(outsider.id);
	});

	it('allows the owner to hand ownership over, demoting themselves to editor', async () => {
		const { courseAdmin, courseEditor, sandbox } = await sandboxSetup();

		const form = await buildForm(editSuperUserSchema, {
			sandboxId: sandbox.id,
			userId: courseEditor.id,
			role: 'owner'
		});
		await expect(SandboxActions.editSuperUser(courseAdmin, form)).rejects.toSatisfy(isRedirect);

		const after = await prisma.sandbox.findUniqueOrThrow({
			where: { id: sandbox.id },
			include: { editors: true }
		});
		expect(after.ownerId).toBe(courseEditor.id);
		expect(after.editors.map((e) => e.id)).toContain(courseAdmin.id);
	});
});

describe('SandboxActions.leaveSandbox', () => {
	// No permission helper: an inline `editors: { some: { id: user.id } }` where clause is the gate.

	it('allows an editor to leave', async () => {
		const { courseEditor, sandbox } = await sandboxSetup();

		const form = await buildForm(leaveSandboxSchema, { sandboxId: sandbox.id });
		await expect(SandboxActions.leaveSandbox(courseEditor, form)).rejects.toSatisfy(isRedirect);

		const after = await prisma.sandbox.findUniqueOrThrow({
			where: { id: sandbox.id },
			include: { editors: true }
		});
		expect(after.editors).toHaveLength(0);
	});

	it('denies a user who is not an editor of the sandbox', async () => {
		const { sandbox } = await sandboxSetup();
		const outsider = await createOutsider();

		const form = await buildForm(leaveSandboxSchema, { sandboxId: sandbox.id });
		const result = await SandboxActions.leaveSandbox(outsider, form);

		expect(errorMessages(result)).toContain("You don't have permission to leave this sandbox");
	});

	it('denies the owner, who is not in the editors list', async () => {
		const { courseAdmin, sandbox } = await sandboxSetup();

		const form = await buildForm(leaveSandboxSchema, { sandboxId: sandbox.id });
		const result = await SandboxActions.leaveSandbox(courseAdmin, form);

		expect(errorMessages(result)).toContain("You don't have permission to leave this sandbox");
		await expect(
			prisma.sandbox.findUniqueOrThrow({ where: { id: sandbox.id } })
		).resolves.toMatchObject({ ownerId: courseAdmin.id });
	});
});

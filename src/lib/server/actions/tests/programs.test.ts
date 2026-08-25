import { beforeEach, describe, expect, it } from 'vitest';
import { isRedirect } from '@sveltejs/kit';

import prisma from '$lib/server/db/prisma';
import { ProgramActions } from '$lib/server/actions/Programs';
import {
	deleteProgramSchema,
	editProgramSchema,
	editSuperUserSchema,
	newProgramSchema
} from '$lib/zod/programSchema';

import {
	FIXTURE_PROGRAMS,
	createOutsider,
	fixtureUsers,
	getProgram,
	seedFixture
} from './helpers/fixture';
import { asErrorObject, buildForm, errorMessages } from './helpers/actions';

// ProgramActions is the only action class where no method uses withPermissionCheck: every failure
// path is hand-rolled. That makes the messages here reliable, so these tests assert on them
// directly rather than going through expectDenied.
//
// The tiers are also the narrowest in the codebase. editProgram and editSuperUser require
// ProgramAdmin, which excludes program editors; deleteProgram requires OnlySuperAdmin, which the
// permission helper enforces by throwing rather than by returning a where fragment.

beforeEach(seedFixture);

describe('ProgramActions.newProgram', () => {
	// Gated by a direct user.role check rather than a where fragment.

	it('allows a super admin', async () => {
		const { superAdmin } = await fixtureUsers();

		const form = await buildForm(newProgramSchema, { name: 'BrandNewProgram' });
		const result = await ProgramActions.newProgram(superAdmin, form);

		expect(result).not.toHaveProperty('status');
		await expect(
			prisma.program.findFirst({ where: { name: 'BrandNewProgram' } })
		).resolves.not.toBeNull();
	});

	it('denies a program admin, who is not a super admin', async () => {
		const { programAdmin } = await fixtureUsers();

		const form = await buildForm(newProgramSchema, { name: 'BrandNewProgram' });
		const result = await ProgramActions.newProgram(programAdmin, form);

		expect(errorMessages(result)).toContain('You do not have permission to perform this action');
		await expect(
			prisma.program.findFirst({ where: { name: 'BrandNewProgram' } })
		).resolves.toBeNull();
	});
});

describe('ProgramActions.editProgram', () => {
	// ProgramAdmin tier: program editors are outside it.

	it('allows the program admin', async () => {
		const { programAdmin } = await fixtureUsers();
		const program = await getProgram(FIXTURE_PROGRAMS.two);

		const form = await buildForm(editProgramSchema, {
			programId: program.id,
			name: 'RenamedProgram'
		});
		const result = await ProgramActions.editProgram(programAdmin, form);

		expect(result).not.toHaveProperty('status');
		await expect(
			prisma.program.findUniqueOrThrow({ where: { id: program.id } })
		).resolves.toMatchObject({ name: 'RenamedProgram' });
	});

	it('denies a program editor, one tier below', async () => {
		const { programEditor } = await fixtureUsers();
		const program = await getProgram(FIXTURE_PROGRAMS.three);

		const form = await buildForm(editProgramSchema, {
			programId: program.id,
			name: 'RenamedProgram'
		});
		const result = await ProgramActions.editProgram(programEditor, form);

		expect(errorMessages(result)).toContain('Unauthorized');
		await expect(
			prisma.program.findUniqueOrThrow({ where: { id: program.id } })
		).resolves.toMatchObject({ name: FIXTURE_PROGRAMS.three });
	});
});

describe('ProgramActions.deleteProgram', () => {
	// OnlySuperAdmin: whereHasProgramPermission throws for non-admins rather than returning a
	// fragment, so the denial surfaces as { error } from the surrounding catch, not as a form error.

	it('allows a super admin, redirecting on success', async () => {
		const { superAdmin } = await fixtureUsers();
		const program = await getProgram(FIXTURE_PROGRAMS.one);

		const form = await buildForm(deleteProgramSchema, { programId: program.id });
		await expect(ProgramActions.deleteProgram(superAdmin, form)).rejects.toSatisfy(isRedirect);

		await expect(prisma.program.findUnique({ where: { id: program.id } })).resolves.toBeNull();
	});

	it('denies a program admin and keeps the program', async () => {
		const { programAdmin } = await fixtureUsers();
		const program = await getProgram(FIXTURE_PROGRAMS.two);

		const form = await buildForm(deleteProgramSchema, { programId: program.id });
		const result = await ProgramActions.deleteProgram(programAdmin, form);

		expect(asErrorObject(result).error).toBe('Only super admins can do this action');
		await expect(prisma.program.findUnique({ where: { id: program.id } })).resolves.not.toBeNull();
	});
});

describe('ProgramActions.editSuperUser', () => {
	// Returns undefined on success rather than { form }.

	it('allows the program admin to grant an editor role', async () => {
		const { programAdmin } = await fixtureUsers();
		const outsider = await createOutsider();
		const program = await getProgram(FIXTURE_PROGRAMS.two);

		const form = await buildForm(editSuperUserSchema, {
			programId: program.id,
			userId: outsider.id,
			role: 'editor'
		});
		const result = await ProgramActions.editSuperUser(programAdmin, form);

		expect(result).toBeUndefined();
		const after = await prisma.program.findUniqueOrThrow({
			where: { id: program.id },
			include: { editors: true }
		});
		expect(after.editors.map((e) => e.id)).toContain(outsider.id);
	});

	it('denies a program editor and grants nobody anything', async () => {
		const { programEditor } = await fixtureUsers();
		const outsider = await createOutsider();
		const program = await getProgram(FIXTURE_PROGRAMS.three);

		const form = await buildForm(editSuperUserSchema, {
			programId: program.id,
			userId: outsider.id,
			role: 'admin'
		});
		const result = await ProgramActions.editSuperUser(programEditor, form);

		expect(errorMessages(result)).toContain('Unauthorized');
		const after = await prisma.program.findUniqueOrThrow({
			where: { id: program.id },
			include: { admins: true, editors: true }
		});
		expect(after.admins).toHaveLength(0);
		expect(after.editors.map((e) => e.id)).not.toContain(outsider.id);
	});

	it('denies a course admin, who holds no program role at all', async () => {
		const { courseAdmin } = await fixtureUsers();
		const outsider = await createOutsider();
		const program = await getProgram(FIXTURE_PROGRAMS.two);

		const form = await buildForm(editSuperUserSchema, {
			programId: program.id,
			userId: outsider.id,
			role: 'admin'
		});
		const result = await ProgramActions.editSuperUser(courseAdmin, form);

		expect(errorMessages(result)).toContain('Unauthorized');
		const after = await prisma.program.findUniqueOrThrow({
			where: { id: program.id },
			include: { admins: true }
		});
		expect(after.admins.map((a) => a.id)).not.toContain(outsider.id);
	});
});

import { describe, expect, it } from 'vitest';
import { superValidate } from 'sveltekit-superforms/server';
import { zod4 as zod } from 'sveltekit-superforms/adapters';

import prisma from '$lib/server/db/prisma';
import { UserActions } from '$lib/server/actions/Users';
import { ProgramActions } from '$lib/server/actions/Programs';
import { changeUserRoleSchema } from '$lib/zod/userSchema';
import { editSuperUserSchema } from '$lib/zod/programSchema';

import type { User } from '@prisma/client';

// Both actions only read `id` and `role` off the caller, and a super admin's permission clauses
// resolve to `{}`, so the caller does not need a row of its own here.
const CALLER = { id: 'last-admin-test-caller', role: 'ADMIN' } as unknown as User;

const EMAILS = ['first@lastadmin.test', 'second@lastadmin.test'];

/** Leaves the database with exactly two super admins, and returns them. */
async function twoSuperAdmins() {
	await prisma.user.deleteMany({ where: { email: { in: EMAILS } } });
	await prisma.user.updateMany({ where: { role: 'ADMIN' }, data: { role: 'USER' } });

	return await Promise.all(
		EMAILS.map((email) => prisma.user.create({ data: { role: 'ADMIN', email } }))
	);
}

/** The form errors of a settled action result, or null when the action succeeded. */
function formErrors(result: unknown) {
	if (!result || typeof result !== 'object' || !('data' in result)) return null;
	const data = result.data as { form?: { errors?: { _errors?: string[] } } } | undefined;
	return data?.form?.errors?._errors ?? null;
}

describe('last admin invariant under concurrency', () => {
	it('keeps a super admin when two demotions race each other', async () => {
		const [first, second] = await twoSuperAdmins();

		const demote = async (userId: string) =>
			UserActions.changeRole(
				CALLER,
				await superValidate({ userId, role: 'USER' as const }, zod(changeUserRoleSchema))
			);

		const results = await Promise.all([demote(first.id), demote(second.id)]);

		expect(await prisma.user.count({ where: { role: 'ADMIN' } })).toBe(1);
		expect(results.map(formErrors).filter(Boolean)).toHaveLength(1);
	});

	it('keeps a program admin when two revokes race each other', async () => {
		const [first, second] = await twoSuperAdmins();
		const program = await prisma.program.create({
			data: {
				name: 'LastAdminProgram',
				admins: { connect: [{ id: first.id }, { id: second.id }] }
			}
		});

		const revoke = async (userId: string) =>
			ProgramActions.editSuperUser(
				CALLER,
				await superValidate(
					{ programId: program.id, userId, role: 'revoke' as const },
					zod(editSuperUserSchema)
				)
			);

		const results = await Promise.all([revoke(first.id), revoke(second.id)]);

		const after = await prisma.program.findFirstOrThrow({
			where: { id: program.id },
			include: { admins: { select: { id: true } } }
		});
		expect(after.admins).toHaveLength(1);
		expect(results.map(formErrors).filter(Boolean)).toHaveLength(1);
	});
});

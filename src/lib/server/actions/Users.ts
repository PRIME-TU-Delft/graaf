import prisma from '$lib/server/db/prisma';
import { setError } from '$lib/utils/setError';
import { GuardError, isWriteConflict, WRITE_CONFLICT_MESSAGE } from './transaction';
import { redirect, type RequestEvent } from '@sveltejs/kit';

import type { changeUserRoleSchema } from '$lib/zod/userSchema';
import type { User } from '@prisma/client';
import type { Infer, SuperValidated } from 'sveltekit-superforms';

/**
 * Get the currently authenticated user for a request, redirecting to `/auth` if there is none.
 * Use this in load functions and form actions that require a logged-in user.
 *
 * @param locals - The request event's `locals`, used to read the Auth.js session
 * @returns The authenticated user. Never resolves without one: on a missing session, throws a
 * redirect to `/auth` instead of returning.
 */
export async function getUser({ locals }: { locals: RequestEvent['locals'] }) {
	const session = await locals.auth();
	const user = session?.user as User | undefined;
	if (!user) redirect(303, '/auth');

	return user!;
}

/**
 * Get the currently authenticated user for a request, without redirecting. Use this in API
 * routes and other places that need to return a JSON error response instead of a redirect when
 * there is no session.
 *
 * @param locals - The request event's `locals`, used to read the Auth.js session
 * @returns The authenticated user, or `{ error: 'Unauthorized' }` if there is no session
 */
export async function getUserResponse({ locals }: { locals: RequestEvent['locals'] }) {
	const session = await locals.auth();
	const user = session?.user as User | undefined;
	if (!user) return { error: 'Unauthorized' };

	return user;
}

/** Server actions for managing users themselves, as opposed to their per-program or per-course
 * roles. Called from form actions in `+page.server.ts` route files, one static method per
 * operation. */
export class UserActions {
	/**
	 * Promote a user to super admin, or demote a super admin back to a regular user.
	 *
	 * PERMISSIONS:
	 * - Only super admins can change the super-admin role
	 *
	 * Two guards keep the install reachable: you cannot demote yourself, and you cannot demote the
	 * last remaining admin. Given only admins may call this, the self-demote guard already implies
	 * the second one, but the count check is kept as a backstop so the invariant still holds if the
	 * caller check above ever widens.
	 *
	 * The count and the update run in one serializable transaction, so two demotions racing each
	 * other cannot both read the same admin count and leave the install with nobody left to
	 * administer it. Postgres rolls one of them back, and that caller is asked to try again.
	 *
	 * @param user - The user performing the action, must have the super-admin role
	 * @param form - Validated form data with the target userId and the new role
	 * @returns `{ form }` on success. On invalid input, missing permission, a demotion that would
	 * lock everyone out, or a lost race against a concurrent role change, returns the form with
	 * an error via setError instead of throwing.
	 */
	static async changeRole(user: User, form: SuperValidated<Infer<typeof changeUserRoleSchema>>) {
		if (!form.valid) return setError(form, '', 'Form is not valid');

		if (user.role !== 'ADMIN') {
			return setError(form, '', 'You do not have permission to perform this action');
		}

		const { userId, role } = form.data;

		if (role === 'USER' && userId === user.id) {
			return setError(form, '', 'You cannot demote yourself');
		}

		try {
			await prisma.$transaction(
				async (tx) => {
					if (role === 'USER') {
						const remainingAdmins = await tx.user.count({
							where: { role: 'ADMIN', id: { not: userId } }
						});

						if (remainingAdmins === 0) throw new GuardError('You cannot demote the last admin');
					}

					await tx.user.update({
						where: { id: userId },
						data: { role }
					});
				},
				{ isolationLevel: 'Serializable' }
			);
		} catch (e: unknown) {
			if (e instanceof GuardError) return setError(form, '', e.message);
			if (isWriteConflict(e)) return setError(form, '', WRITE_CONFLICT_MESSAGE);

			return setError(form, '', e instanceof Error ? e.message : `${e}`);
		}

		return { form };
	}
}

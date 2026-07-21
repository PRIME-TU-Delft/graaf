import type { User } from '@prisma/client';
import { redirect, type RequestEvent } from '@sveltejs/kit';

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

import { env } from '$env/dynamic/private';
import { Prisma } from '@prisma/client';
import { setError } from '$lib/utils/setError';

import type { FormPathLeavesWithErrors, SuperValidated } from 'sveltekit-superforms';

/**
 * Run a permission-scoped Prisma action and translate a not-found-under-this-where failure into
 * a form error. Every action in this layer that mutates a record behind a permission-scoped
 * `where` clause should call this instead of hand-rolling try/catch/setError.
 *
 * @param action - Performs the permission-scoped query/queries and awaits them
 * @param form - The form to attach an error to if the action fails
 * @param path - The form field to attach the error to
 * @param opts.entity - The Prisma model name of the top-level query in `action` (e.g. `'Course'`
 * for a `prisma.course.update(...)`), matched against a P2025 with that `meta.modelName` (Prisma
 * 7+) or the legacy "No '<entity>' record" `meta.cause` string (pre-7), either of which Prisma
 * reports when the permission-scoped where clause excludes the record
 * @param opts.message - The permission-denied message to show when that cause matches
 * @returns `{ form }` on success. If `action` fails because the record wasn't found under the
 * permission-scoped where clause, sets `opts.message`; otherwise sets the underlying error
 * message. Either way returns the form via setError instead of throwing.
 */
export async function withPermissionCheck<T, S extends Record<string, unknown>>(
	action: () => Promise<T>,
	form: SuperValidated<S>,
	path: '' | FormPathLeavesWithErrors<S>,
	opts: { entity: string; message: string }
) {
	try {
		await action();
	} catch (e: unknown) {
		if (env.DEBUG) console.error(e);

		if (e instanceof Prisma.PrismaClientKnownRequestError) {
			const isNotFoundCause =
				e.meta &&
				'cause' in e.meta &&
				typeof e.meta.cause === 'string' &&
				e.meta.cause.includes(`No '${opts.entity}' record`);

			const isNotFoundP2025 = e.code === 'P2025' && e.meta && e.meta.modelName === opts.entity;

			if (isNotFoundCause || isNotFoundP2025) {
				return setError(form, path, opts.message);
			}
		}

		return setError(form, path, e instanceof Error ? e.message : `${e}`);
	}

	return { form };
}

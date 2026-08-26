import { env } from '$env/dynamic/private';
import { Prisma } from '@prisma/client';
import { setError } from '$lib/utils/setError';

import type { FormPathLeavesWithErrors, SuperValidated } from 'sveltekit-superforms';

/**
 * Thrown inside a `prisma.$transaction` callback to roll the transaction back when a check that
 * guards an invariant fails. The message is written for the user, so `withGuardedMutation` catches
 * this and hands the message straight to `setError`.
 */
export class GuardError extends Error {}

/** Default message shown when a serializable transaction lost a race and the user should submit
 * again. Override via `opts.writeConflictMessage` for callers where this wording doesn't fit. */
export const WRITE_CONFLICT_MESSAGE =
	'Someone changed this at the same time, so this change was not applied. Please try again.';

/**
 * Whether an error is a serialization failure or deadlock, which Postgres raises when it rolls
 * back one of two concurrent serializable transactions whose interleaving would have broken an
 * invariant one of them checked.
 *
 * @param e - The error caught around a `prisma.$transaction` call
 * @returns True if the transaction lost that race and can safely be retried, false for any other
 * failure
 */
export function isWriteConflict(e: unknown) {
	if (e instanceof Prisma.PrismaClientKnownRequestError) return e.code === 'P2034';

	// The pg driver adapter throws a DriverAdapterError instead of mapping the failure onto P2034,
	// keeping the Postgres error in `cause`: 40001 is serialization_failure, 40P01 deadlock_detected
	const cause = (e as { cause?: { originalCode?: string } } | null)?.cause;
	return cause?.originalCode === '40001' || cause?.originalCode === '40P01';
}

/**
 * Run a mutation and translate its failure into a form error, in one of three ways depending on
 * how it fails. Every action in this layer that mutates a record, whether behind a
 * permission-scoped `where` clause or inside a guarded `prisma.$transaction`, should call this
 * instead of hand-rolling try/catch/setError.
 *
 * @param action - Performs the mutation and awaits it
 * @param form - The form to attach an error to if the action fails
 * @param path - The form field to attach the error to
 * @param opts.entity - The Prisma model name of the top-level query in `action` (e.g. `'Course'`
 * for a `prisma.course.update(...)`), matched against a P2025/P2017 error with that
 * `meta.modelName` (Prisma 7+) or the legacy "No '<entity>' record" `meta.cause` string (pre-7),
 * either of which Prisma reports when a permission-scoped where clause excludes the record. Omit
 * for transaction-only callers whose permission failure already arrives as a `GuardError`.
 * @param opts.message - The permission-denied message to show when `opts.entity` matches. Required
 * together with `opts.entity`.
 * @param opts.writeConflictMessage - Message shown on a lost transaction race. Defaults to
 * `WRITE_CONFLICT_MESSAGE`.
 * @returns `{ form }` on success. On failure, sets one of: `e.message` if `action` threw a
 * `GuardError`; `opts.writeConflictMessage` if the transaction lost a serializable race;
 * `opts.message` if the record wasn't found under the permission-scoped where clause; otherwise
 * the underlying error message. Either way returns the form via setError instead of throwing.
 */
export async function withGuardedMutation<T, S extends Record<string, unknown>>(
	action: () => Promise<T>,
	form: SuperValidated<S>,
	path: '' | FormPathLeavesWithErrors<S>,
	opts:
		| { entity: string; message: string; writeConflictMessage?: string }
		| { writeConflictMessage?: string } = {}
) {
	try {
		await action();
	} catch (e: unknown) {
		if (env.DEBUG === 'true') console.error(e);

		if (e instanceof GuardError) return setError(form, path, e.message);

		if (isWriteConflict(e)) {
			return setError(form, path, opts.writeConflictMessage ?? WRITE_CONFLICT_MESSAGE);
		}

		if ('entity' in opts && e instanceof Prisma.PrismaClientKnownRequestError) {
			const isNotFoundCause =
				e.meta &&
				'cause' in e.meta &&
				typeof e.meta.cause === 'string' &&
				e.meta.cause.includes(`No '${opts.entity}' record`);

			const isNotFoundModelName =
				(e.code === 'P2025' || e.code === 'P2017') &&
				e.meta &&
				'modelName' in e.meta &&
				e.meta.modelName === opts.entity;

			if (isNotFoundCause || isNotFoundModelName) {
				return setError(form, path, opts.message);
			}
		}

		return setError(form, path, e instanceof Error ? e.message : `${e}`);
	}

	return { form };
}

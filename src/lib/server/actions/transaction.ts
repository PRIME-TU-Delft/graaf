import { Prisma } from '@prisma/client';

/**
 * Thrown inside a `prisma.$transaction` callback to roll the transaction back when a check that
 * guards an invariant fails. The message is written for the user, so callers catch this and hand
 * the message straight to `setError`.
 */
export class GuardError extends Error {}

/** Shown when a serializable transaction lost a race and the user should submit again. */
export const WRITE_CONFLICT_MESSAGE =
	'Someone changed these roles at the same time, so this change was not applied. Please try again.';

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

// Imported from /server rather than the package root: the root barrel re-exports SuperDebug.svelte,
// which the integration vitest config cannot transform (it runs without the Svelte plugin).
import { superValidate } from 'sveltekit-superforms/server';
import { zod4 as zod } from 'sveltekit-superforms/adapters';

import type { InferIn, ZodValidationSchema } from 'sveltekit-superforms/adapters';

/**
 * Build the `SuperValidated` form object that every server action method takes as its second
 * argument. Mirrors what the `+page.server.ts` form actions do, so tests exercise the same shape
 * the real callers pass in.
 *
 * Always await this: some schemas (e.g. `changeDomainRelSchema`) carry an async `.refine`.
 */
export async function buildForm<T extends ZodValidationSchema>(
	schema: T,
	data: Partial<InferIn<T, 'zod4'>>
) {
	return await superValidate(data, zod(schema));
}

/**
 * Actions report a permission denial by returning `setError(...)`, which is SvelteKit's
 * `fail(400, { form })` rather than a thrown exception. Narrows a method's return value to that
 * failure shape so tests can read `.status` and `.data.form.errors` off it.
 */
export function asFailure(result: unknown) {
	if (!result || typeof result !== 'object' || !('status' in result)) {
		throw new Error(`Expected an ActionFailure, got: ${JSON.stringify(result)}`);
	}

	return result as { status: number; data: { form: { errors: Record<string, unknown> } } };
}

/**
 * Asserts the shape of a permission denial: SvelteKit's `fail(400, { form })` with at least one
 * error attached, and returns it for any further inspection.
 *
 * Deliberately does not check the message text. Methods that route failures through
 * `withGuardedMutation` currently emit a raw Prisma error rather than their intended
 * permission-denied message (see #153), so asserting on wording here would pin a bug in place.
 * Use `errorMessages` for the methods that hand-roll setError, where the wording is reliable.
 */
export function expectDenied(result: unknown) {
	const failure = asFailure(result);

	if (failure.status !== 400) {
		throw new Error(`Expected status 400, got ${failure.status}`);
	}
	if (Object.keys(failure.data.form.errors).length === 0) {
		throw new Error('Expected the failed form to carry at least one error');
	}

	return failure;
}

/**
 * Weaker form of `expectDenied` for methods that return a 400 carrying no error at all, because
 * they write to a form path setError cannot traverse (see #154). Use `expectDenied` everywhere
 * else, and tighten these call sites once that is fixed.
 */
export function expectDeniedWithoutMessage(result: unknown) {
	const failure = asFailure(result);

	if (failure.status !== 400) {
		throw new Error(`Expected status 400, got ${failure.status}`);
	}

	return failure;
}

/** Collects every error message on a failed form, whichever field it was attached to. */
export function errorMessages(result: unknown): string[] {
	const errors = asFailure(result).data.form.errors;

	return Object.values(errors)
		.flat(Infinity as 1)
		.filter((value): value is string => typeof value === 'string');
}

/**
 * A handful of methods hand-roll their failure path and return `{ error: string }` instead of
 * going through setError. Narrows to that shape.
 */
export function asErrorObject(result: unknown) {
	if (!result || typeof result !== 'object' || !('error' in result)) {
		throw new Error(`Expected an { error } object, got: ${JSON.stringify(result)}`);
	}

	return result as { error: string };
}

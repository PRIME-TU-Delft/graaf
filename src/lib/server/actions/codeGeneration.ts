import prisma from '$lib/server/db/prisma';

/**
 * Turn free text into a lowercase, URL-safe slug: runs of non-alphanumeric characters collapse to
 * a single dash, and leading/trailing dashes are trimmed. Falls back to `'sandbox'` if nothing
 * alphanumeric survives (e.g. the input was empty or entirely symbols).
 */
export function slugify(input: string): string {
	const slug = input
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
	return slug || 'sandbox';
}

/**
 * Whether `code` is already used as a Course or Sandbox code/uriCode. Course and Sandbox codes
 * share one URL namespace (`/graph/[code]/[alias]`), so uniqueness has to be checked across both
 * tables at the app level: Postgres can't express a unique constraint spanning two tables.
 *
 * @param code - The code to check
 * @param exclude - A row to exclude from the check, e.g. the record currently being renamed
 * @returns True if some other Course or Sandbox already has this code or uriCode
 */
export async function isCodeTaken(
	code: string,
	exclude: { courseId?: number; sandboxId?: number } = {}
): Promise<boolean> {
	const [course, sandbox] = await Promise.all([
		prisma.course.findFirst({
			where: {
				OR: [{ code }, { uriCode: code }],
				...(exclude.courseId !== undefined ? { id: { not: exclude.courseId } } : {})
			}
		}),
		prisma.sandbox.findFirst({
			where: {
				OR: [{ code }, { uriCode: code }],
				...(exclude.sandboxId !== undefined ? { id: { not: exclude.sandboxId } } : {})
			}
		})
	]);

	return course !== null || sandbox !== null;
}

/**
 * Slugify `ident` and, if that collides with an existing Course or Sandbox code, append an
 * incrementing numeric suffix until it's unique. Used to auto-generate a new sandbox's code from
 * its owner's name.
 */
export async function generateUniqueCode(ident: string): Promise<string> {
	const base = slugify(ident);
	let candidate = base;
	let suffix = 1;

	while (await isCodeTaken(candidate)) {
		suffix += 1;
		candidate = `${base}-${suffix}`;
	}

	return candidate;
}

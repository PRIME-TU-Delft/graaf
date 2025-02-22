import { programSchema } from '$lib/zod/programCourseSchema';
import type { User } from '@prisma/client';
import type { RequestEvent } from '@sveltejs/kit';
import {
	fail,
	setError,
	superValidate,
	type Infer,
	type SuperValidated
} from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import prisma from '../db/prisma';

export class ProgramActions {
	static async test(event: RequestEvent) {
		const session = await event.locals.auth();

		const user = session?.user as User | undefined;

		return { test: 'test', user };
	}

	static async newProgram(event: RequestEvent, form: SuperValidated<Infer<typeof programSchema>>) {
		if (!form.valid) {
			return fail(400, { form });
		}

		// Check if user is a super admin
		const session = await event.locals.auth();

		if ((session?.user as User)?.role !== 'ADMIN') {
			return fail(403, { form, error: 'You do not have permission to perform this action' });
		}

		try {
			await prisma.program.create({
				data: {
					name: form.data.name
				}
			});
		} catch (e) {
			if (!(e instanceof Object) || !('message' in e)) {
				return setError(form, 'name', e instanceof Error ? e.message : `${e}`);
			}

			return setError(form, 'name', `${e.message}`);
		}

		return {
			form
		};
	}
}

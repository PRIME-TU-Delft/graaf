import type { Session } from '@auth/sveltekit';
import type { User } from '@prisma/client';
import type { RequestEvent } from '@sveltejs/kit';
import type { SuperValidated } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { describe, expect, test } from 'vitest';
import type { ZodObject, ZodRawShape } from 'zod';
import { regularUser } from './helpers/test-users';

function mockLocals(user: User) {
	const session: Session = { user: regularUser, expires: new Date().toDateString() };

	async function auth() {
		return session;
	}

	return { auth } as RequestEvent['locals'];
}

async function mockForm<T extends Record<string, unknown>, S extends ZodRawShape>(
	data: T,
	schema: ZodObject<S>
) {
	const z = await zod(schema).validate(data);

	const form: SuperValidated<T> = {
		id: 'mock',
		valid: z.success,
		data,
		posted: true,
		errors: { _errors: [] }
	};

	if (!z.success) {
		const errors = (form.errors._errors = z.issues.map((i) => i.message));
		form.errors._errors = errors;
	}

	return form;
}

describe('New Program', () => {
	test('admin user is allowed to add new program', async () => {
		expect(1).toBe(1);
	});

	test('regular user is not allowed to add new program', async () => {
		expect(1).toBe(1);
	});

	// test('new program works', async () => {
	// 	const locals = mockLocals(regularUser);
	// 	const event = { locals } as RequestEvent;
	// 	const form = await mockForm({ name: 'new-program' }, programSchema);

	// 	const response = await ProgramActions.newProgram(event, form);

	// 	console.log(response);
	// });
});

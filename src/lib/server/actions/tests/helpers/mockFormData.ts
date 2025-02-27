import type { ZodRawShape } from 'zod';

export default function mockForm<T extends Record<string, unknown>, S extends ZodRawShape>(
	data: T
): FormData {
	const formData = {
		get: (key: keyof T) => data[key]
	} as unknown as FormData;

	return formData;
}

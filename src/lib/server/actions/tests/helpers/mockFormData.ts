export default function mockForm<T extends Record<string, unknown>>(data: T): FormData {
	const formData = {
		get: (key: keyof T) => data[key]
	} as unknown as FormData;

	return formData;
}

import { superForm, type SuperValidated } from 'sveltekit-superforms';

// These forms are shared and reused per row (e.g. one form per table row), mutated only by
// an effect from component props, never typed into. `resetForm` defaults to `true` in v2, which
// snaps `$form` back to its initial (blank) shape after a successful submit. Since these forms
// carry no per-row identity of their own, a default-`true` reset would wipe the just-set fields
// and break the next row's submit with a client-validation failure before it reaches the server.
export function useSyncedSuperForm<T extends Record<string, unknown>>(
	formInput: SuperValidated<T>,
	options: Parameters<typeof superForm<T>>[1],
	buildFields: () => Partial<T>
) {
	const form = superForm(formInput, { ...options, resetForm: false });

	// Keep the store in sync with the hidden inputs, otherwise client-side validation rejects
	// the submit before it leaves the page
	$effect(() => {
		form.form.update((current) => ({ ...current, ...buildFields() }));
	});

	return form;
}

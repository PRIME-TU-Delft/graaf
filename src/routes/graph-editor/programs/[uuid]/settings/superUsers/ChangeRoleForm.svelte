<script lang="ts">
	import { page } from '$app/state';
	import * as Form from '$lib/components/ui/form/index.js';
	import { editSuperUserSchema } from '$lib/zod/superUserProgramSchema';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import type { PageData } from '../$types';

	type ChangeRoleProps = {
		userId: string;
		newRole: 'Admin' | 'Editor' | 'Revoke';
	};

	let { userId, newRole }: ChangeRoleProps = $props();

	let popupOpen = $state(true);

	const form = superForm((page.data as PageData).editSuperUserForm, {
		id: 'editSuperUserForm' + userId + '-' + newRole,
		validators: zodClient(editSuperUserSchema),
		onResult: ({ result }) => {
			console.log({ result });
			if (result.type == 'success') {
				toast.success('Role successfully changed!');
				popupOpen = false;
			}
		}
	});
	const { form: formData, enhance, submitting, delayed } = form;

	const { program, user } = page.data as PageData;
	$effect(() => {
		// When program.id or userId changes, update the form data
		$formData.programId = program.id;
		$formData.userId = userId;
		$formData.role = newRole.toLowerCase() as 'admin' | 'editor' | 'revoke';
	});
</script>

<form action="?/edit-super-user" method="POST" class="grow" use:enhance>
	<input type="hidden" name="userId" value={userId} />
	<input type="hidden" name="programId" value={program.id} />
	<input type="hidden" name="role" value={newRole} />

	<Form.FormError {form} />
	<Form.FormButton
		disabled={$submitting}
		loading={$delayed}
		variant={newRole == 'Revoke' ? 'destructive' : 'default'}
		class="w-full"
	>
		To {newRole}
		{#snippet loadingMessage()}
			<span>Changing role...</span>
		{/snippet}
	</Form.FormButton>
</form>

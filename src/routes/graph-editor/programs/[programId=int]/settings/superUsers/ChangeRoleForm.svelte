<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { editSuperUserSchema } from '$lib/zod/programSchema';
	import { useId } from 'bits-ui';

	// Components
	import * as Form from '$lib/components/ui/form/index.js';
	import { Button } from '$lib/components/ui/button';

	// Icons
	import Check from 'lucide-svelte/icons/check';

	// Types
	import type { User, Program } from '@prisma/client';
	import type { SuperValidated, Infer } from 'sveltekit-superforms';

	type ChangeRoleProps = {
		user: User;
		program: Program;
		newRole: 'Admin' | 'Editor' | 'Revoke';
		editSuperUserForm: SuperValidated<Infer<typeof editSuperUserSchema>>;
		selected?: boolean;
		disabled?: boolean;
		onSuccess?: () => void;
	};

	let {
		user,
		program,
		newRole,
		editSuperUserForm,
		selected = false,
		disabled = false,
		onSuccess = () => {}
	}: ChangeRoleProps = $props();

	const form = superForm(editSuperUserForm, {
		id: 'edit-super-user-' + useId(),
		validators: zodClient(editSuperUserSchema),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('Role successfully changed!');
				onSuccess();
			}
		}
	});
	const { form: formData, enhance, submitting, delayed } = form;

	$effect(() => {
		$formData.userId = user.id;
		$formData.programId = program.id;
		$formData.role = newRole.toLowerCase() as 'admin' | 'editor' | 'revoke';
	});
</script>

{#if selected}
	<Button variant="outline" class="justify-between">
		{newRole}
		<Check />
	</Button>
{:else}
	<form action="?/edit-super-user" method="POST" class="grow" use:enhance>
		<input type="hidden" name="userId" value={user.id} />
		<input type="hidden" name="programId" value={program.id} />
		<input type="hidden" name="role" value={newRole.toLowerCase()} />

		{#if newRole == 'Revoke'}
			<p>Are you sure?</p>
		{/if}

		<Form.FormError {form} />
		<Form.FormButton
			disabled={$submitting || disabled}
			loading={$delayed}
			variant={newRole == 'Revoke' ? 'destructive' : 'outline'}
			class="w-full justify-start"
		>
			{newRole == 'Revoke' ? 'Yes, sure!' : newRole}
			{#snippet loadingMessage()}
				<span>Changing role...</span>
			{/snippet}
		</Form.FormButton>
	</form>
{/if}

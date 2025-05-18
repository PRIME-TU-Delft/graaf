<script lang="ts">
	import { page } from '$app/state';
	import { useId } from 'bits-ui';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { editSuperUserSchema } from '$lib/zod/sandboxSchema';
	
	// Components
	import * as Form from '$lib/components/ui/form/index.js';
	import SelectUsers from '$lib/components/SelectUsers.svelte';
	import DialogButton from '$lib/components/DialogButton.svelte';

	// Types
	import type { PageData } from './$types';
	
	const data = page.data as PageData;

	// Get users that can be transfered to
	const nonOwner = $derived(
		data.allUsers.filter(
			(user) => data.sandbox.owner.id != user.id
		)
	);

	// Build the form
	const form = superForm(data.editSuperUserForm, {
		id: 'edit-super-user-' + useId(),
		validators: zodClient(editSuperUserSchema),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('Successfully transferred ownership!');
				transferOwnershipDialogOpen = false;
			}
		}
	});

	const { form: formData, enhance, submitting, delayed } = form;

	// Svelte stuff
	let transferOwnershipDialogOpen = $state(false);
	$effect(() => {
		$formData.sandboxId = data.sandbox.id;
		$formData.role = 'owner';
	});

</script>

<DialogButton
	variant="destructive"
	button="Transfer Ownership"
	title="Transfer Ownership"
	icon="swap"
	description="
	Transfer ownership of this sandbox to another user. 
	You will become an editor, and lose the ability to edit the settings of this sandbox.
	"
	bind:open={transferOwnershipDialogOpen}
>
	<form action="?/edit-super-user" method="POST" use:enhance>
		<input type="hidden" name="sandboxId" value={data.sandbox.id} />
		<input type="hidden" name="role" value="owner" />

		<Form.Field {form} name="userId">
			<SelectUsers
				users={nonOwner}
				onSelect={(user) => {
					$formData.userId = user.id;
				}}
			/>
		</Form.Field>

		<div class="mt-2 flex items-center justify-between gap-1">
			<Form.FormError class="w-full" {form} />
			<Form.FormButton disabled={$submitting || !$formData.userId} loading={$delayed}>
				Transfer ownership
				{#snippet loadingMessage()}
					<span>Transferring ownership...</span>
				{/snippet}
			</Form.FormButton>
		</div>
	</form>
</DialogButton>



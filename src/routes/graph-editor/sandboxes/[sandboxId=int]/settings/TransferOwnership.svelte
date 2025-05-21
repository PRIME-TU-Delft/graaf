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
	import { Button } from '$lib/components/ui/button';

	// Icons
	import { Undo2 } from '@lucide/svelte';

	// Types
	import type { PageData } from './$types';

	const data = page.data as PageData;
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

	let transferOwnershipDialogOpen = $state(false);
	const nonOwner = $derived(data.allUsers.filter((user) => data.sandbox.owner.id != user.id));

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
		This will transfer ownership of this sandbox to another user. 
		You will become an editor, and lose the ability to edit the settings of this sandbox.
		This cannot be undone by you.
	"
	bind:open={transferOwnershipDialogOpen}
>
	<form action="?/edit-super-user" method="POST" use:enhance>
		<input type="hidden" name="sandboxId" value={data.sandbox.id} />
		<input type="hidden" name="role" value="owner" />

		<Form.Field {form} name="userId">
			<SelectUsers
				value={$formData.userId}
				users={nonOwner}
				onSelect={(user) => {
					$formData.userId = user.id;
				}}
			/>
			<Form.FieldErrors />
		</Form.Field>

		<div class="mt-2 flex items-center justify-between gap-1">
			<Form.FormError class="w-full" {form} />
			<Button
				variant="outline"
				onclick={() =>
					form.reset({
						newState: {
							userId: undefined,
							sandboxId: data.sandbox.id,
							role: 'owner'
						}
					})}
			>
				<Undo2 /> Reset
			</Button>
			<Form.FormButton disabled={$submitting} loading={$delayed}>
				Transfer ownership
				{#snippet loadingMessage()}
					<span>Transferring ownership...</span>
				{/snippet}
			</Form.FormButton>
		</div>
	</form>
</DialogButton>

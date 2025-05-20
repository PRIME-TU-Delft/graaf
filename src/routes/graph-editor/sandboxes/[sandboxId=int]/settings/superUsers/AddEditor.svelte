<script lang="ts">
	import { page } from '$app/state';
	import { editSuperUserSchema } from '$lib/zod/sandboxSchema';
	import { useId } from 'bits-ui';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	
	// Components
	import { Button } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form/index.js';
	import SelectUsers from '$lib/components/SelectUsers.svelte';

	// Icons
	import { Plus, Undo2 } from '@lucide/svelte';

	// Types
	import type { PageData } from '../$types';
	import type { Sandbox, User } from '@prisma/client';

	type AddEditorProps = {
		sandbox: Sandbox & {
			owner: User;
			editors: User[];
		};
		onSuccess?: () => void;
	};

	let { sandbox, onSuccess = () => {} }: AddEditorProps = $props();
	
	const data = page.data as PageData;
	const form = superForm(data.editSuperUserForm, {
		id: 'edit-super-user-' + useId(),
		validators: zodClient(editSuperUserSchema),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('Successfully added editor!');
				onSuccess();
			}
		}
	});

	const { form: formData, enhance, submitting, delayed } = form;

	const nonSuperUser = $derived(
		data.allUsers.filter(
			user => sandbox.owner.id != user.id && !sandbox.editors.some((u) => u.id == user.id)
		)
	);

	$effect(() => {
		$formData.sandboxId = sandbox.id;
		$formData.role = 'editor';
	});
	
</script>

<form action="?/edit-super-user" method="POST" use:enhance>
	<input type="hidden" name="sandboxId" value={sandbox.id} />
	<input type="hidden" name="role" value="editor" />

	<Form.Field {form} name="userId">
		<SelectUsers
			value={$formData.userId}
			users={nonSuperUser}
			onSelect={(user) => {
				$formData.userId = user.id;
			}}
		/>
	</Form.Field>

	<div class="mt-2 flex items-center justify-between gap-1">
		<Form.FormError class="w-full" {form} />
		<Button
			variant="outline"
			onclick={() =>
				form.reset({
					newState: {
						userId: undefined,
						sandboxId: sandbox.id,
						role: 'editor'
					}
				})}
		>
			<Undo2 /> Reset
		</Button>
		<Form.FormButton disabled={$submitting} loading={$delayed}>
			<Plus /> Add editor
			{#snippet loadingMessage()}
				<span>Adding user...</span>
			{/snippet}
		</Form.FormButton>
	</div>
</form>

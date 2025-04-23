<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form/index.js';
	import Check from 'lucide-svelte/icons/check';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import type { PageData } from '../$types';
	import { editSuperUserSchema } from '$lib/zod/courseSchema';

	type ChangeRoleProps = {
		userId: string;
		newRole: 'Admin' | 'Editor' | 'Revoke';
		selected?: boolean;
		disabled?: boolean;
		onSuccess?: () => void;
	};

	let {
		userId,
		newRole,
		selected = false,
		disabled = false,
		onSuccess = () => {}
	}: ChangeRoleProps = $props();

	const form = superForm((page.data as PageData).editSuperUserForm, {
		id: 'editSuperUserForm' + userId + '-' + newRole,
		validators: zodClient(editSuperUserSchema),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('Role successfully changed!');
				onSuccess();
			}
		}
	});
	const { form: formData, enhance, submitting, delayed } = form;

	const { course } = page.data as PageData;
	$effect(() => {
		// When program.id or userId changes, update the form data
		$formData.courseId = course.id;
		$formData.userId = userId;
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
		<input type="hidden" name="userId" value={userId} />
		<input type="hidden" name="courseId" value={course.id} />
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

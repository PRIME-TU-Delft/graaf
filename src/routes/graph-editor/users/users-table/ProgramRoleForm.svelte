<script lang="ts">
	import { page } from '$app/state';
	import { editSuperUserSchema } from '$lib/zod/programSchema';
	import { useId } from 'bits-ui';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client as zodClient } from 'sveltekit-superforms/adapters';
	import { toast } from 'svelte-sonner';

	// Components
	import { Button, type ButtonVariant } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form/index.js';

	// Types
	import type { Program } from '@prisma/client';
	import type { PageData } from '../$types';
	import type { DataUser } from './userTableColumns';

	type Props = {
		user: DataUser;
		program: Program;
		role: 'admin' | 'editor' | 'revoke';
		label: string;
		successMessage: string;
		/** When set, the button first reveals this message plus a destructive confirm button */
		confirmMessage?: string;
		variant?: ButtonVariant;
		disabled?: boolean;
	};

	const {
		user,
		program,
		role,
		label,
		successMessage,
		confirmMessage,
		variant = 'outline',
		disabled = false
	}: Props = $props();

	let confirming = $state(false);

	// svelte-ignore state_referenced_locally
	const form = superForm((page.data as PageData).editSuperUserForm, {
		id: `edit-super-user-${program.id}-${role}-${useId()}`,
		validators: zodClient(editSuperUserSchema),
		// These fields are filled from the row, never typed in, so resetting the store after a
		// successful submit would just empty it and make the next submit fail client-side
		// validation without ever reaching the server
		resetForm: false,
		onResult: ({ result }) => {
			if (result.type === 'success') {
				toast.success(successMessage);
				confirming = false;
			}
		}
	});

	const { form: formData, enhance, submitting, delayed } = form;

	// Keep the store in sync with the hidden inputs, otherwise client-side validation rejects
	// the submit before it leaves the page
	$effect(() => {
		$formData.userId = user.id;
		$formData.programId = program.id;
		$formData.role = role;
	});
</script>

<form action="?/edit-super-user" method="POST" use:enhance>
	<input type="hidden" name="userId" value={user.id} />
	<input type="hidden" name="programId" value={program.id} />
	<input type="hidden" name="role" value={role} />

	{#if confirmMessage && !confirming}
		<Button size="sm" {variant} {disabled} onclick={() => (confirming = true)}>{label}</Button>
	{:else if confirmMessage}
		<div class="flex items-center gap-2">
			<p class="m-0 text-sm">{confirmMessage}</p>
			<Form.FormButton
				size="sm"
				variant="destructive"
				disabled={$submitting || disabled}
				loading={$delayed}
			>
				Yes, sure!
				{#snippet loadingMessage()}
					<span>Saving...</span>
				{/snippet}
			</Form.FormButton>
			<Button size="sm" variant="ghost" onclick={() => (confirming = false)}>Cancel</Button>
		</div>
	{:else}
		<Form.FormButton size="sm" {variant} disabled={$submitting || disabled} loading={$delayed}>
			{label}
			{#snippet loadingMessage()}
				<span>Saving...</span>
			{/snippet}
		</Form.FormButton>
	{/if}

	<Form.FormError class="mt-1" {form} />
</form>

<script lang="ts">
	import { page } from '$app/state';
	import { editSuperUserSchema } from '$lib/zod/programSchema';
	import { useId } from 'bits-ui';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client as zodClient } from 'sveltekit-superforms/adapters';
	import { toast } from 'svelte-sonner';

	// Components
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { Button, buttonVariants, type ButtonVariant } from '$lib/components/ui/button';
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
		/** When set, the button opens a confirmation dialog instead of submitting straight away */
		confirm?: { title: string; description: string; action: string };
		variant?: ButtonVariant;
		disabled?: boolean;
	};

	const {
		user,
		program,
		role,
		label,
		successMessage,
		confirm,
		variant = 'outline',
		disabled = false
	}: Props = $props();

	let confirmOpen = $state(false);

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
				confirmOpen = false;
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

{#snippet hiddenFields()}
	<input type="hidden" name="userId" value={user.id} />
	<input type="hidden" name="programId" value={program.id} />
	<input type="hidden" name="role" value={role} />
{/snippet}

{#if !confirm}
	<form action="?/edit-super-user" method="POST" use:enhance>
		{@render hiddenFields()}

		<Form.FormButton size="sm" {variant} disabled={$submitting || disabled} loading={$delayed}>
			{label}
			{#snippet loadingMessage()}
				<span>Saving...</span>
			{/snippet}
		</Form.FormButton>

		<Form.FormError class="mt-1" {form} />
	</form>
{:else if disabled}
	<Button size="sm" {variant} disabled>{label}</Button>
{:else}
	<AlertDialog.Root bind:open={confirmOpen}>
		<AlertDialog.Trigger class={buttonVariants({ variant, size: 'sm' })}>
			{label}
		</AlertDialog.Trigger>

		<AlertDialog.Content>
			<AlertDialog.Header>
				<AlertDialog.Title>{confirm.title}</AlertDialog.Title>
				<AlertDialog.Description>{confirm.description}</AlertDialog.Description>
			</AlertDialog.Header>

			<Form.FormError {form} />

			<AlertDialog.Footer>
				<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
				<form action="?/edit-super-user" method="POST" use:enhance>
					{@render hiddenFields()}

					<Form.FormButton {variant} disabled={$submitting} loading={$delayed}>
						{confirm.action}
						{#snippet loadingMessage()}
							<span>Saving...</span>
						{/snippet}
					</Form.FormButton>
				</form>
			</AlertDialog.Footer>
		</AlertDialog.Content>
	</AlertDialog.Root>
{/if}

<script lang="ts">
	import { page } from '$app/state';
	import { useSyncedSuperForm } from '$lib/utils/syncedSuperForm.svelte';
	import { editSuperUserSchema } from '$lib/zod/programSchema';
	import { useId } from 'bits-ui';
	import { zod4Client as zodClient } from 'sveltekit-superforms/adapters';
	import type { z } from 'zod';
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
	const form = useSyncedSuperForm<z.infer<typeof editSuperUserSchema>>(
		(page.data as PageData).editSuperUserForm,
		{
			id: `edit-super-user-${program.id}-${role}-${useId()}`,
			validators: zodClient(editSuperUserSchema),
			onResult: ({ result }) => {
				if (result.type === 'success') {
					toast.success(successMessage);
					confirmOpen = false;
				}
			}
		},
		() => ({ userId: user.id, programId: program.id, role })
	);

	const { enhance, submitting, delayed } = form;
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

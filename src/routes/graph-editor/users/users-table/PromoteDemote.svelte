<script lang="ts">
	import { page } from '$app/state';
	import { cn } from '$lib/utils';
	import { displayName } from '$lib/utils/displayUserName';
	import { useSyncedSuperForm } from '$lib/utils/syncedSuperForm.svelte';
	import { changeUserRoleSchema } from '$lib/zod/userSchema';
	import { useId } from 'bits-ui';
	import { zod4Client as zodClient } from 'sveltekit-superforms/adapters';
	import type { z } from 'zod';
	import { toast } from 'svelte-sonner';

	// Components
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form/index.js';

	// Icons
	import ShieldOff from '@lucide/svelte/icons/shield-off';
	import ShieldUser from '@lucide/svelte/icons/shield-user';

	// Types
	import type { PageData } from '../$types';
	import type { DataUser } from './userTableColumns';

	type Props = {
		user: DataUser;
	};

	const { user }: Props = $props();

	const data = $derived(page.data as PageData);
	const isAdmin = $derived(user.role === 'ADMIN');
	const isSelf = $derived(data.user.id === user.id);
	const isLastAdmin = $derived(isAdmin && data.users.filter((u) => u.role === 'ADMIN').length <= 1);
	const newRole = $derived(isAdmin ? 'USER' : 'ADMIN');

	// Why the demote button is unavailable, or null when it is available
	const blockedReason = $derived.by(() => {
		if (!isAdmin) return null;
		if (isSelf) return 'You cannot demote yourself.';
		if (isLastAdmin) return 'This is the last super admin, so they cannot be demoted.';
		return null;
	});

	let confirmOpen = $state(false);
	let submittedRole = $state<'ADMIN' | 'USER'>('ADMIN');

	const form = useSyncedSuperForm<z.infer<typeof changeUserRoleSchema>>(
		(page.data as PageData).changeUserRoleForm,
		{
			id: 'change-user-role-' + useId(),
			validators: zodClient(changeUserRoleSchema),
			onSubmit: () => {
				submittedRole = newRole;
			},
			onResult: ({ result }) => {
				if (result.type === 'success') {
					toast.success(
						submittedRole === 'ADMIN'
							? 'User promoted to super admin'
							: 'User demoted to regular user'
					);
					confirmOpen = false;
				}
			}
		},
		() => ({ userId: user.id, role: newRole })
	);

	const { enhance, submitting, delayed } = form;
</script>

<div class="mt-2">
	<p class="m-0 text-sm text-purple-700">
		{#if isAdmin}
			This user is a super admin and can reach every program, course and this admin panel.
		{:else}
			This user has no super admin rights.
		{/if}
	</p>

	{#if blockedReason}
		<Button size="sm" variant="destructive" class="mt-2" disabled>
			<ShieldOff /> Demote to user
		</Button>
		<p class="m-0 mt-2 text-xs text-purple-500">{blockedReason}</p>
	{:else}
		<AlertDialog.Root bind:open={confirmOpen}>
			<AlertDialog.Trigger
				class={cn(
					buttonVariants({ variant: isAdmin ? 'destructive' : 'default', size: 'sm' }),
					'mt-2'
				)}
			>
				{#if isAdmin}
					<ShieldOff /> Demote to user
				{:else}
					<ShieldUser /> Promote to super admin
				{/if}
			</AlertDialog.Trigger>

			<AlertDialog.Content>
				<AlertDialog.Header>
					<AlertDialog.Title>
						{isAdmin
							? `Demote ${displayName(user)} to a regular user?`
							: `Promote ${displayName(user)} to super admin?`}
					</AlertDialog.Title>
					<AlertDialog.Description>
						{#if isAdmin}
							They lose access to this admin panel, and keep only the program and course roles they
							were given directly.
						{:else}
							They will be able to reach every program and course, this admin panel, and the
							privileges of every other user.
						{/if}
					</AlertDialog.Description>
				</AlertDialog.Header>

				<Form.FormError {form} />

				<AlertDialog.Footer>
					<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
					<form action="?/change-user-role" method="POST" use:enhance>
						<input type="hidden" name="userId" value={user.id} />
						<input type="hidden" name="role" value={newRole} />

						<Form.FormButton
							variant={isAdmin ? 'destructive' : 'default'}
							disabled={$submitting}
							loading={$delayed}
						>
							{isAdmin ? 'Yes, demote' : 'Yes, promote'}
							{#snippet loadingMessage()}
								<span>{isAdmin ? 'Demoting...' : 'Promoting...'}</span>
							{/snippet}
						</Form.FormButton>
					</form>
				</AlertDialog.Footer>
			</AlertDialog.Content>
		</AlertDialog.Root>
	{/if}
</div>

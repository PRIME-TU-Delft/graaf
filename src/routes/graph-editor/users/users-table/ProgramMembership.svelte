<script lang="ts">
	import { page } from '$app/state';
	import { displayName } from '$lib/utils/displayUserName';

	// Components
	import AddToProgram from './AddToProgram.svelte';
	import ProgramRoleForm from './ProgramRoleForm.svelte';

	// Types
	import type { PageData } from '../$types';
	import type { DataUser } from './userTableColumns';

	type Props = {
		user: DataUser;
	};

	const { user }: Props = $props();

	const data = $derived(page.data as PageData);

	const memberships = $derived(
		[
			...user.program_admins.map((program) => ({ program, role: 'admin' as const })),
			...user.program_editors.map((program) => ({ program, role: 'editor' as const }))
		].toSorted((a, b) => a.program.name.localeCompare(b.program.name))
	);

	/** True when giving up this membership would leave the program without any admin, which the
	 * server refuses. Checked here so the dialog can disable the control and say why. */
	function isOnlyAdminOf(programId: number, role: 'admin' | 'editor') {
		if (role != 'admin') return false;

		const program = data.allPrograms.find((p) => p.id == programId);
		return (program?.admins.length ?? 0) <= 1;
	}
</script>

<div class="mt-2">
	{#if memberships.length == 0}
		<p class="m-0 text-sm text-purple-600">This user does not belong to any program.</p>
	{:else}
		<ul class="m-0 flex list-none flex-col gap-2 p-0">
			{#each memberships as { program, role } (role + program.id)}
				{@const onlyAdmin = isOnlyAdminOf(program.id, role)}
				{@const removeConfirm = {
					title: `Remove ${displayName(user)} from ${program.name}?`,
					description: `They lose their ${role} role on this program, and any access it gave them.`,
					action: 'Yes, remove'
				}}
				<li class="m-0 rounded border border-purple-200 bg-purple-50/50 p-2">
					<div class="flex flex-wrap items-center justify-between gap-2">
						<span class="text-sm font-medium">{program.name}</span>
						<span class="text-xs text-purple-600">{role == 'admin' ? 'Admin' : 'Editor'}</span>
					</div>

					<div class="mt-2 flex flex-wrap items-center gap-2">
						{#if role == 'admin'}
							<ProgramRoleForm
								{user}
								{program}
								role="editor"
								label="Make editor"
								successMessage="Role changed to editor"
								disabled={onlyAdmin}
							/>
						{:else}
							<ProgramRoleForm
								{user}
								{program}
								role="admin"
								label="Make admin"
								successMessage="Role changed to admin"
							/>
						{/if}

						<ProgramRoleForm
							{user}
							{program}
							role="revoke"
							label="Remove from program"
							variant="destructive"
							confirm={removeConfirm}
							successMessage="User removed from program"
							disabled={onlyAdmin}
						/>
					</div>

					{#if onlyAdmin}
						<p class="m-0 mt-2 text-xs text-purple-500">
							This user is the only admin of this program, so their admin role cannot be given up.
						</p>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}

	<AddToProgram {user} />
</div>

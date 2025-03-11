<script lang="ts">
	import { page } from '$app/state';
	import { buttonVariants } from '$lib/components/ui/button';
	import * as Popover from '$lib/components/ui/popover';
	import { cn } from '$lib/utils';
	import { hasProgramPermissions } from '$lib/utils/permissions';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import type { PageData } from '../$types';
	import ChangeRoleForm from './ChangeRoleForm.svelte';

	type ChangeRoleProps = {
		userId: string;
		role: 'Admin' | 'Editor';
		name: string;
	};

	let { userId, role, name }: ChangeRoleProps = $props();

	let popupOpen = $state(false);

	const { program, user } = page.data as PageData;
</script>

<!-- Only programAdmins and superUsers are allowed to cahnge roles, otherwise just show the role name -->
{#if hasProgramPermissions( user, program, { programAdmin: true, programEditor: false, superAdmin: true } )}
	<Popover.Root bind:open={popupOpen}>
		<Popover.Trigger class={cn([buttonVariants({ variant: 'outline' }), 'float-right'])}>
			{role}
			<ChevronDown />
		</Popover.Trigger>
		<Popover.Content>
			<p class="text-lg font-bold">Change role</p>
			<p>Of user: <span class="font-mono">{name}</span></p>
			<p>From: <span class="font-mono">{role}</span></p>

			<div class="mt-2 flex gap-2">
				{#if role === 'Admin'}
					<ChangeRoleForm {userId} newRole="Editor" />
				{:else}
					<ChangeRoleForm {userId} newRole="Admin" />
				{/if}
				<ChangeRoleForm {userId} newRole="Revoke" />
			</div>
		</Popover.Content>
	</Popover.Root>
{:else}
	{role}
{/if}

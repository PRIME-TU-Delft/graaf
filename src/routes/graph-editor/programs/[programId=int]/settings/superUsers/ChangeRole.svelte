<script lang="ts">
	import * as Menubar from '$lib/components/ui/menubar/index.js';
	import { hasProgramPermissions } from '$lib/utils/permissions';
	import type { Program, User } from '@prisma/client';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import ChangeRoleForm from './ChangeRoleForm.svelte';

	type ChangeRoleProps = {
		userId: string;
		currentRole: 'Admin' | 'Editor';
		superAdminCount: number;
		program: Program & { admins: User[]; editors: User[] };
		user: User;
	};

	let { userId, currentRole, superAdminCount, program, user }: ChangeRoleProps = $props();

	let menuIsFocusOn = $state('');
</script>

<!-- Only programAdmins and superUsers are allowed to change roles, otherwise just show the role name -->
{#if hasProgramPermissions(user, program, 'ProgramAdmin')}
	<Menubar.Root
		class="float-right w-fit p-0"
		value={menuIsFocusOn}
		onValueChange={(value) => (menuIsFocusOn = value)}
	>
		<Menubar.Menu value="menu">
			<Menubar.Trigger>
				{currentRole}
				<ChevronDown />
			</Menubar.Trigger>
			<Menubar.Content>
				<Menubar.Item class="p-0"></Menubar.Item>

				<Menubar.Sub>
					<Menubar.SubTrigger>Change role</Menubar.SubTrigger>
					<Menubar.SubContent class="ml-1 flex w-32 flex-col gap-2">
						<ChangeRoleForm
							{userId}
							newRole="Editor"
							selected={currentRole == 'Editor'}
							disabled={superAdminCount <= 1}
							onSuccess={() => (menuIsFocusOn = '')}
						/>
						<ChangeRoleForm
							{userId}
							newRole="Admin"
							selected={currentRole == 'Admin'}
							onSuccess={() => (menuIsFocusOn = '')}
						/>
					</Menubar.SubContent>
				</Menubar.Sub>

				{#if superAdminCount > 1 || currentRole == 'Editor'}
					<Menubar.Separator />

					<!-- You are not the last user -->
					<Menubar.Sub>
						<Menubar.SubTrigger class="font-bold text-red-700 hover:bg-red-100">
							Remove user privilages
						</Menubar.SubTrigger>
						<Menubar.SubContent class="ml-1 w-32">
							<ChangeRoleForm {userId} newRole="Revoke" onSuccess={() => (menuIsFocusOn = '')} />
						</Menubar.SubContent>
					</Menubar.Sub>
				{/if}
			</Menubar.Content>
		</Menubar.Menu>
	</Menubar.Root>
{:else}
	<p class="m-0 text-right">
		{currentRole}
	</p>
{/if}

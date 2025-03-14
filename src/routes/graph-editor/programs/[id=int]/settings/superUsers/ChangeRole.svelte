<script lang="ts">
	import * as Menubar from '$lib/components/ui/menubar/index.js';
	import { hasProgramPermissions } from '$lib/utils/permissions';
	import type { Program, User } from '@prisma/client';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import ChangeRoleForm from './ChangeRoleForm.svelte';

	type ChangeRoleProps = {
		userId: string;
		currentRole: 'Admin' | 'Editor';
		superUserCount: number;
		program: Program & { admins: User[]; editors: User[] };
		user: User;
	};

	let { userId, currentRole, superUserCount, program, user }: ChangeRoleProps = $props();
</script>

<!-- Only programAdmins and superUsers are allowed to cahnge roles, otherwise just show the role name -->
{#if hasProgramPermissions( user, program, { programAdmin: true, programEditor: false, superAdmin: true } )}
	<Menubar.Root class="float-right w-fit p-0">
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
						<ChangeRoleForm {userId} newRole="Editor" selected={currentRole == 'Editor'} />
						<ChangeRoleForm {userId} newRole="Admin" selected={currentRole == 'Admin'} />
					</Menubar.SubContent>
				</Menubar.Sub>

				{#if superUserCount > 1}
					<Menubar.Separator />

					<!-- You are not the last user -->
					<Menubar.Sub>
						<Menubar.SubTrigger class="font-bold text-red-700 hover:bg-red-100">
							Remove user privilages
						</Menubar.SubTrigger>
						<Menubar.SubContent class="ml-1 w-32">
							<ChangeRoleForm {userId} newRole="Revoke" />
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

<script lang="ts">
	import * as Menubar from '$lib/components/ui/menubar/index.js';
	import { hasCoursePermissions, hasProgramPermissions } from '$lib/utils/permissions';
	import type { Course, Program, User } from '@prisma/client';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import ChangeRoleForm from './ChangeRoleForm.svelte';

	type CourseAdminProps = {
		user: User;
		course: Course & {
			admins: User[];
			editors: User[];
			programs: (Program & { admins: User[]; editors: User[] })[];
		};
		courseRole?: 'Course Admin' | 'Course Editor';
		userId: string;
	};

	let { user, course, courseRole, userId }: CourseAdminProps = $props();

	let menuIsFocusOn = $state('');
</script>

<!-- Only programAdmins and superUsers are allowed to change roles, otherwise just show the role name -->
{#if hasCoursePermissions(user, course, 'CourseAdminORProgramAdminEditor')}
	<Menubar.Root
		class="float-right w-fit p-0"
		value={menuIsFocusOn}
		onValueChange={(value) => (menuIsFocusOn = value)}
	>
		<Menubar.Menu value="menu">
			<Menubar.Trigger>
				{courseRole}
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
							selected={courseRole == 'Course Editor'}
							onSuccess={() => (menuIsFocusOn = '')}
						/>
						<ChangeRoleForm
							{userId}
							newRole="Admin"
							selected={courseRole == 'Course Admin'}
							onSuccess={() => (menuIsFocusOn = '')}
						/>
					</Menubar.SubContent>
				</Menubar.Sub>

				<Menubar.Separator />

				<Menubar.Sub>
					<Menubar.SubTrigger class="font-bold text-red-700 hover:bg-red-100">
						Remove user privilages
					</Menubar.SubTrigger>
					<Menubar.SubContent class="ml-1 w-32">
						<ChangeRoleForm {userId} newRole="Revoke" onSuccess={() => (menuIsFocusOn = '')} />
					</Menubar.SubContent>
				</Menubar.Sub>
			</Menubar.Content>
		</Menubar.Menu>
	</Menubar.Root>
{:else}
	<p class="m-0 text-right">
		{courseRole}
	</p>
{/if}

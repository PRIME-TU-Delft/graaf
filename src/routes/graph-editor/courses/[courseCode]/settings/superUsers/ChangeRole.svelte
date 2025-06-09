<script lang="ts">
	import { hasCoursePermissions } from '$lib/utils/permissions';

	// Components
	import ChangeRoleForm from './ChangeRoleForm.svelte';
	import * as Menubar from '$lib/components/ui/menubar/index.js';

	// Icons
	import ChevronDown from 'lucide-svelte/icons/chevron-down';

	// Types
	import type { Course, Program, User } from '@prisma/client';
	import { buttonVariants } from '$lib/components/ui/button';

	type CourseAdminProps = {
		user: User;
		course: Course & {
			admins: User[];
			editors: User[];
			programs: (Program & { admins: User[]; editors: User[] })[];
		};
		courseRole?: 'Admin' | 'Editor';
	};

	let { user, course, courseRole }: CourseAdminProps = $props();

	let menuIsFocusOn = $state('');
</script>

<!-- Only programAdmins and superUsers are allowed to change roles, otherwise just show the role name -->
{#if hasCoursePermissions(user, course, 'CourseAdminORProgramAdminEditor')}
	<Menubar.Root
		class="w-fit p-0"
		value={menuIsFocusOn}
		onValueChange={(value) => (menuIsFocusOn = value)}
	>
		<Menubar.Menu value="menu">
			<Menubar.Trigger class={buttonVariants({ variant: 'outline' })}>
				{courseRole}
				<ChevronDown />
			</Menubar.Trigger>
			<Menubar.Content>
				<Menubar.Item class="p-0"></Menubar.Item>

				<Menubar.Sub>
					<Menubar.SubTrigger>Change role</Menubar.SubTrigger>
					<Menubar.SubContent class="ml-1 flex w-32 flex-col gap-2">
						<ChangeRoleForm
							userId={user.id}
							newRole="Editor"
							selected={courseRole == 'Editor'}
							onSuccess={() => (menuIsFocusOn = '')}
						/>
						<ChangeRoleForm
							userId={user.id}
							newRole="Admin"
							selected={courseRole == 'Admin'}
							onSuccess={() => (menuIsFocusOn = '')}
						/>
					</Menubar.SubContent>
				</Menubar.Sub>

				{#if courseRole != undefined}
					<Menubar.Separator />

					<Menubar.Sub>
						<Menubar.SubTrigger class="font-bold text-red-700 hover:bg-red-100">
							Remove user privilages
						</Menubar.SubTrigger>
						<Menubar.SubContent class="ml-1 w-32">
							<ChangeRoleForm
								userId={user.id}
								newRole="Revoke"
								onSuccess={() => (menuIsFocusOn = '')}
							/>
						</Menubar.SubContent>
					</Menubar.Sub>
				{/if}
			</Menubar.Content>
		</Menubar.Menu>
	</Menubar.Root>
{:else}
	<p class="m-0 text-right">
		{courseRole}
	</p>
{/if}

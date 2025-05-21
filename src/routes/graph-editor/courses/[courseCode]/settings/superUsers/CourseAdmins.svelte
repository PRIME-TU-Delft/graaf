<script lang="ts">
	import { renderComponent } from '$lib/components/ui/data-table';
	import type { Course, Program, User } from '@prisma/client';
	import type { ColumnDef } from '@tanstack/table-core';
	import ChangeRole from './ChangeRole.svelte';
	import SuperUserDataTable from './SuperUserDataTable.svelte';
	import { Button } from '$lib/components/ui/button';
	import Funnel from '@lucide/svelte/icons/filter';
	import FunnelX from '@lucide/svelte/icons/filter-x';

	type CourseAdminProps = {
		user: User;
		course: Course & {
			admins: User[];
			editors: User[];
			programs: (Program & { admins: User[]; editors: User[] })[];
		};
	};

	type SuperUser = User & { courseRole?: 'Course Admin' | 'Course Editor' } & {
		programRole?: 'Program Admin' | 'Program Editor';
	};

	let { user, course }: CourseAdminProps = $props();
	let onlyCourseSuperUsers = $state(false);

	let users = $derived.by(() => {
		const courseAdmins: SuperUser[] = course.admins.map((user) => {
			return {
				courseRole: 'Course Admin',
				...user
			} as const;
		});
		const courseEditors: SuperUser[] = course.editors.map((user) => {
			return {
				courseRole: 'Course Editor',
				...user
			} as const;
		});

		const superUsers = courseAdmins.concat(courseEditors);
		const userMap = new Map(superUsers.map((user) => [user.id, user]));

		for (const program of course.programs) {
			for (const admin of program.admins) {
				if (userMap.has(admin.id)) {
					userMap.get(admin.id)!.programRole = 'Program Admin';
				} else {
					userMap.set(admin.id, {
						programRole: 'Program Admin',
						...admin
					} as const);
				}
			}

			for (const editor of program.editors) {
				if (userMap.has(editor.id)) {
					userMap.get(editor.id)!.programRole = 'Program Editor';
				} else {
					userMap.set(editor.id, {
						programRole: 'Program Editor',
						...editor
					} as const);
				}
			}
		}

		return userMap;
	});

	let filteredUsers = $derived.by(() => {
		if (onlyCourseSuperUsers) {
			return (
				users
					.values()
					.filter((user) => user.courseRole)
					.toArray?.() || []
			);
		}
		return users.values().toArray?.() || [];
	});

	const columns: ColumnDef<SuperUser>[] = $derived([
		{
			accessorKey: 'nickname',
			header: 'Name'
		},
		{
			accessorKey: 'programRole',
			header: 'Program Role'
		},
		{
			accessorKey: 'courseRole',
			header: 'Role',
			cell: ({ row }) =>
				renderComponent(ChangeRole, {
					userId: row.original.id,
					courseRole: row.original.courseRole,
					course,
					user
				})
		}
	]);
</script>

<section class="prose container mx-auto mt-8 p-4">
	<h2 class="m-0">Course Admins and Editors</h2>

	<p>
		A course editor is allowed to change graphs. An admin is also allowed to create links and
		(De)Archive courses.
	</p>

	<Button
		class="mb-1"
		variant="outline"
		onclick={() => (onlyCourseSuperUsers = !onlyCourseSuperUsers)}
	>
		{#if onlyCourseSuperUsers}
			<FunnelX />
			Show all admins and editors
		{:else}
			<Funnel />
			Hide program admins and editors
		{/if}
	</Button>

	<SuperUserDataTable data={filteredUsers} {course} {columns} />
</section>

<script lang="ts">
	import { renderComponent } from '$lib/components/ui/data-table';
	import type { Program, User } from '@prisma/client';
	import type { ColumnDef } from '@tanstack/table-core';
	import ChangeRole from './ChangeRole.svelte';
	import DataTable from './SuperUserDataTable.svelte';

	type ProgramAdminProps = {
		user: User;
		program: Program & { admins: User[]; editors: User[] };
	};
	type ProgramUser = User & { programRole: 'Admin' | 'Editor' };

	let { user, program }: ProgramAdminProps = $props();

	let users = $derived.by(() => {
		const admins: ProgramUser[] = program.admins.map((user) => {
			return {
				programRole: 'Admin',
				...user
			} as const;
		});
		const editors: ProgramUser[] = program.editors.map((user) => {
			return {
				programRole: 'Editor',
				...user
			} as const;
		});

		function getName(user: User) {
			return user.nickname || user.firstName + ' ' + user.lastName || user.email;
		}

		const u = admins.concat(editors);
		const sortedUsers = u.toSorted((a, b) => {
			// When `a` is the current user, it should be at the top
			if (a.id == user.id) return -1;

			// Otherwise sort on name alphabetically
			return getName(a).localeCompare(getName(b));
		});

		return sortedUsers;
	});

	const columns: ColumnDef<ProgramUser>[] = $derived([
		{
			accessorKey: 'nickname',
			header: 'Name'
		},
		{
			accessorKey: 'programRole',
			header: 'Role',
			cell: ({ row }) =>
				renderComponent(ChangeRole, {
					userId: row.original.id,
					currentRole: row.original.programRole,
					superAdminCount: program.admins.length,
					program,
					user
				})
		}
	]);
</script>

<section class="prose container mx-auto p-4">
	<h2>Super Users</h2>
	<p>Super Users are the admins and editors of a program or course.</p>
	<ul class="text-sm">
		<li>
			<b>Course Admins</b><br />
			Course Admins are able to manage course settings, permanently delete graphs and links, and archive
			the course.
		</li>
		<li>
			<b>Course Editors</b><br />
			Course Editors are able to create and edit graphs and links, but not delete them.
		</li>
		<li>
			<b>Program Admins & Editors</b><br />
			Program Admins and Editors implicitly have admin permissions for all courses in their program.
			Program Admins can also manage the program settings, while Program Editors can only edit the name
			of them.
		</li>
	</ul>

	<DataTable data={users} {program} {columns} />
</section>

<script lang="ts">
	import type { Program, User } from '@prisma/client';
	import DataTable from './SuperUserDataTable.svelte';
	import { columns, type ProgramUser } from './program-admin-columns';

	type ProgramAdminProps = {
		program: Program & { admins: User[]; editors: User[] };
	};

	let { program }: ProgramAdminProps = $props();

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
		const sortedUsers = u.toSorted((a, b) => getName(a).localeCompare(getName(b)));

		return sortedUsers;
	});
</script>

<section class="container prose mx-auto p-4">
	<h2 class="mb-2">Program super users</h2>
	<p>
		A <span class="font-mono">Program Editor</span> is able to add or delete a course to this
		program, they are also able to link new courses to this program. A
		<span class="font-mono">Program Admin</span>
		has the same permissions as an <span class="font-mono">Program Editor</span> except it is also able
		to manage program permissions, attributes (name) and delete a program.
	</p>

	<DataTable data={users} {program} {columns} />
</section>

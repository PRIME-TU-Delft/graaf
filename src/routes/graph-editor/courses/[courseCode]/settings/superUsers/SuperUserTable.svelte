<script lang="ts">
	// Components
	import * as Table from '$lib/components/ui/table/index.js';
	import { displayName } from '$lib/utils/displayUserName';
	import AddSuperUser from './AddSuperUser.svelte';
	import ChangeRole from './ChangeRole.svelte';

	// Types
	import type { User, Course, Program } from '@prisma/client';

	type GraphLinksProps = {
		user: User;
		course: Course & {
			admins: User[];
			editors: User[];
			programs: (Program & { admins: User[]; editors: User[] })[];
		};
	};

	const { user, course }: GraphLinksProps = $props();
</script>

<div class="rounded-md border">
	<Table.Root class="!m-0">
		<Table.Header>
			<Table.Row>
				<Table.Head>Name</Table.Head>
				<Table.Head>Role</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each course.admins as user (user.id)}
				<Table.Row class="bg-purple-100/50 odd:bg-purple-50/50 hover:bg-purple-100/30">
					<Table.Cell>
						{displayName(user)}
					</Table.Cell>
					<Table.Cell class="text-left">
						<ChangeRole {user} {course} courseRole="Admin" />
					</Table.Cell>
				</Table.Row>
			{/each}

			{#each course.editors as user (user.id)}
				<Table.Row class="bg-purple-50/50 odd:bg-purple-100/50 hover:bg-purple-100/30">
					<Table.Cell>
						{displayName(user)}
					</Table.Cell>
					<Table.Cell>
						<ChangeRole {user} {course} courseRole="Editor" />
					</Table.Cell>
				</Table.Row>
			{/each}

			<Table.Row>
				<Table.Cell colspan={2}>
					<AddSuperUser {course} />
				</Table.Cell>
			</Table.Row>
		</Table.Body>
	</Table.Root>
</div>

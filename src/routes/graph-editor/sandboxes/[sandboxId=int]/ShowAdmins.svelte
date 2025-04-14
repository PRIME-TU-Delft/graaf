<script lang="ts">
	import DialogButton from '$lib/components/DialogButton.svelte';
	import type { Course, Program, User } from '@prisma/client';
	import * as Table from '$lib/components/ui/table/index.js';
	import { displayName } from '$lib/utils/displayUserName';

	type ShowAdminsProps = {
		course: Course & {
			editors: User[];
			admins: User[];
			programs: (Program & {
				editors: User[];
				admins: User[];
			})[];
		};
	};

	let { course }: ShowAdminsProps = $props();
</script>

<DialogButton
	title="Super Users for {course.name}"
	description=""
	icon="admins"
	variant="secondary"
	class="max-h-[50dvh] "
>
	<Table.Root class="max-h-[1/2]">
		{#if course.admins.length == 0 || course.editors.length > 0}
			<Table.Header>
				<Table.Row>
					<Table.Head>Name</Table.Head>
					<Table.Head class="text-right">Role</Table.Head>
				</Table.Row>
			</Table.Header>

			<Table.Body>
				{#each course.programs as program (program.id)}
					{#each program.admins as admin (admin.id)}
						<Table.Row>
							<Table.Cell>{displayName(admin)}</Table.Cell>
							<Table.Cell class="text-right">Program-Admin</Table.Cell>
						</Table.Row>
					{/each}
					{#each program.editors as editor (editor.id)}
						<Table.Row>
							<Table.Cell>{displayName(editor)}</Table.Cell>
							<Table.Cell class="text-right">Program-Editor</Table.Cell>
						</Table.Row>
					{/each}
				{/each}

				<!-- TODO: CHeck if there are no conflicts with the program admins -->
				{#each course.admins as admin (admin.id)}
					<Table.Row>
						<Table.Cell>{displayName(admin)}</Table.Cell>
						<Table.Cell class="text-right">Admin</Table.Cell>
					</Table.Row>
				{/each}
				{#each course.editors as editor (editor.id)}
					<Table.Row>
						<Table.Cell>{displayName(editor)}</Table.Cell>
						<Table.Cell class="text-right">Editor</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		{/if}
	</Table.Root>
</DialogButton>

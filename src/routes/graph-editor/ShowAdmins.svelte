<script lang="ts">
	import { displayName } from '$lib/utils/displayUserName';
	import type { Program, User } from '@prisma/client';

	// Components
	import DialogButton from '$lib/components/DialogButton.svelte';
	import * as Table from '$lib/components/ui/table/index.js';

	type ShowAdminsProps = {
		program: Program & {
			editors: User[];
			admins: User[];
		};
	};

	let { program }: ShowAdminsProps = $props();
</script>

<DialogButton
	title="Super Users for {program.name}"
	description=""
	icon="admins"
	variant="secondary"
	class="max-h-[50dvh] "
>
	<Table.Root class="max-h-[1/2]">
		<Table.Header>
			<Table.Row>
				<Table.Head>Name</Table.Head>
				<Table.Head class="text-right">Role</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each program.admins as admin (admin.id)}
				<Table.Row>
					<Table.Cell>{displayName(admin)}</Table.Cell>
					<Table.Cell class="text-right">Admin</Table.Cell>
				</Table.Row>
			{/each}
			{#each program.editors as editor (editor.id)}
				<Table.Row>
					<Table.Cell>{displayName(editor)}</Table.Cell>
					<Table.Cell class="text-right">Editor</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</DialogButton>

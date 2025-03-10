<script lang="ts">
	import DialogButton from '$lib/components/DialogButton.svelte';
	import type { Program, User } from '@prisma/client';
	import * as Table from '$lib/components/ui/table/index.js';
	import { displayName } from '$lib/utils/displayUserName';

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
			{#each program.admins as admin}
				<Table.Row>
					<Table.Cell>{displayName(admin)}</Table.Cell>
					<Table.Cell class="text-right">Admin</Table.Cell>
				</Table.Row>
			{/each}
			{#each program.editors as editor}
				<Table.Row>
					<Table.Cell>{displayName(editor)}</Table.Cell>
					<Table.Cell class="text-right">Editor</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</DialogButton>

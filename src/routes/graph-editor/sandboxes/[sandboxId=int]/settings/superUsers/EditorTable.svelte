<script lang="ts">
	import DialogButton from '$lib/components/DialogButton.svelte';
	import * as Table from '$lib/components/ui/table/index.js';
	import { displayName } from '$lib/utils/displayUserName';
	import type { Sandbox, User } from '@prisma/client';
	import AddEditor from './AddEditor.svelte';
	import RemoveEditor from './RemoveEditor.svelte';

	type SandboxEditorsProps = {
		sandbox: Sandbox & {
			owner: User;
			editors: User[];
		};
	};

	let { sandbox }: SandboxEditorsProps = $props();
	let dialogOpen = $state(false);
</script>

<div class="rounded-md border">
	<Table.Root class="!m-0">
		<Table.Header>
			<Table.Head class="w-full">Name</Table.Head>
			<Table.Head>Actions</Table.Head>
		</Table.Header>
		<Table.Body>
			{#each sandbox.editors as editor (editor.id)}
				<Table.Row>
					<Table.Cell class="font-medium">
						{displayName(editor)}
					</Table.Cell>
					<Table.Cell class="flex items-center justify-end gap-1">
						<RemoveEditor {sandbox} user={editor} />
					</Table.Cell>
				</Table.Row>
			{/each}

			<Table.Row>
				{@render addNewUserButton()}
			</Table.Row>
		</Table.Body>
	</Table.Root>
</div>

{#snippet addNewUserButton()}
	<Table.Cell colspan={2}>
		<DialogButton
			button="Add an editor"
			title="Add an editor"
			description="Add another user as an editor to this sandbox."
			icon="plus"
			bind:open={dialogOpen}
			class="w-full"
		>
			<AddEditor
				{sandbox}
				onSuccess={() => {
					dialogOpen = false;
				}}
			/>
		</DialogButton>
	</Table.Cell>
{/snippet}

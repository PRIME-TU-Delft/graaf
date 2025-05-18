<script lang="ts">
	import type { Sandbox, User } from '@prisma/client';
	import DialogButton from '$lib/components/DialogButton.svelte';
	import * as Table from '$lib/components/ui/table/index.js';
	import AddEditor from './AddEditor.svelte';
	import { displayName } from '$lib/utils/displayUserName';
	import RemoveEditor from './RemoveEditor.svelte';

	type SandboxEditorsProps = {
		user: User;
		sandbox: Sandbox & {
			owner: User;
			editors: User[];
		};
	};

	let { user, sandbox }: SandboxEditorsProps = $props();
	let dialogOpen = $state(false);
</script>

<section class="container prose mx-auto mt-8 p-4">
	<h2 class="m-0">Sandbox Editors</h2>

	<p>
		You can add other users as editors to this sandbox.
		They will be able to view, edit, and share all graphs in this sandbox.
		They cannot change its settings, or delete it.
	</p>

	<div class="rounded-md border">
		<Table.Root class="m-0">
			<Table.Header>
				<Table.Head>Name</Table.Head>
				<Table.Head class="text-right">Actions</Table.Head>
			</Table.Header>
			<Table.Body>
				{#each sandbox.editors as editor (editor.id)}
					<Table.Row>
						<Table.Cell class="font-medium">
							{displayName(editor)}
						</Table.Cell>
						<Table.Cell class="text-right">
							<RemoveEditor
								sandbox={sandbox}
								user={editor}
							/>
						</Table.Cell>
					</Table.Row>
				{/each}

				<Table.Row>
					{@render addNewUserButton()}
				</Table.Row>
			</Table.Body>
		</Table.Root>
	</div>
</section>

{#snippet addNewUserButton(error?: string)}
	<Table.Cell colspan={2}>
		<DialogButton
			button="Add an editor"
			title="Add an editor"
			description="Add another user as an editor to this sandbox."
			icon="plus"
			bind:open={dialogOpen}
			class="w-full"
		>
			<AddEditor {sandbox}
				onSuccess={() => {
					dialogOpen = false;
				}}
			/>
		</DialogButton>
	</Table.Cell>
{/snippet}

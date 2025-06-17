<script lang="ts">
	import { displayName } from '$lib/utils/displayUserName';

	// Components
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Table from '$lib/components/ui/table/index.js';
	import DialogButton from '$lib/components/DialogButton.svelte';
	import NewSandboxButton from './newSandboxButton.svelte';

	// Icons
	import ArrowRight from 'lucide-svelte/icons/arrow-right';

	// Types
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	class SuperUserOpenClass {
		open = $state(false);
	}
</script>

<section class="prose mx-auto mt-12 p-4">
	<h1 class="text-purple-950 shadow-purple-500/70">Sandboxes</h1>
	<p>
		Here you can find all sandboxes you have access to. Sandboxes are private spaces where you can
		create graphs for any purpose!
	</p>
</section>

<section class="mx-auto grid max-w-4xl gap-4 p-4">
	<div class="flex w-full items-center justify-between gap-2">
		<h2 class="w-full grow text-xl font-bold whitespace-nowrap">Your Sandboxes</h2>
		<NewSandboxButton newSandboxForm={data.newSandboxForm} />
	</div>

	{#each data.sandboxes as sandbox (sandbox.id)}
		{@const superUsers = Array.from(new Set([sandbox.owner, ...sandbox.editors]))}

		{@const hasAtLeastEditPermission =
			data.user != undefined && superUsers.some((u) => u.id == data.user?.id)}
		{@const superUsersOpen = new SuperUserOpenClass()}

		<a
			class="group grid w-full grid-cols-2 items-center gap-1 rounded border-2 border-purple-100 bg-purple-50/10 p-4 shadow-none transition-all hover:bg-purple-100 hover:shadow-lg"
			href="/graph-editor/sandboxes/{sandbox.id}"
		>
			<div class="grow">
				<h2 class="text-xl font-bold text-purple-950">{sandbox.name}</h2>
				<div class="grid grid-cols-[max-content_auto] gap-x-3 text-gray-400">
					<span>Owner</span> <span>{displayName(sandbox.owner)}</span>
					<span>Graphs</span> <span>{sandbox._count.graphs}</span>
					<span>Links</span> <span>{sandbox._count.links}</span>
				</div>
			</div>

			<div class="flex grow-0 flex-col gap-1">
				<Button class="transition-colors group-hover:bg-purple-500">
					View{#if hasAtLeastEditPermission}/Edit{/if}
					<ArrowRight />
				</Button>

				{#if superUsers.length > 0}
					<DialogButton
						bind:open={superUsersOpen.open}
						onclick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							superUsersOpen.open = true;
						}}
						button="Super Users"
						icon="admins"
						title="{sandbox.name} Super Users"
						description="View and contact the admins & editors of this sandbox."
					>
						{@render superUsersSnippet(sandbox)}
					</DialogButton>
				{/if}
			</div>
		</a>
	{/each}
</section>

{#snippet superUsersSnippet(sandbox: (typeof data.sandboxes)[0])}
	<div class="rounded-md border">
		<Table.Root class="!m-0">
			<Table.Header>
				<Table.Row>
					<Table.Head>Name</Table.Head>
					<Table.Head>Sandbox Role</Table.Head>
					<Table.Head></Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				<Table.Row class="bg-purple-100/50 odd:bg-purple-50/50 hover:bg-purple-100/30">
					<Table.Cell>
						{displayName(sandbox.owner)}
					</Table.Cell>

					<Table.Cell class="text-left">Owner</Table.Cell>
				</Table.Row>

				{#each sandbox.editors as user (user.id)}
					<Table.Row class="bg-purple-50/50 odd:bg-purple-100/50 hover:bg-purple-100/30">
						<Table.Cell>
							{displayName(user)}
						</Table.Cell>

						<Table.Cell>Editor</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
{/snippet}

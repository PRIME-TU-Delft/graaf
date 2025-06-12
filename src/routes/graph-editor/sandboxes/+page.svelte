<script lang="ts">
	// Components
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Table from '$lib/components/ui/table/index.js';
	import DialogButton from '$lib/components/DialogButton.svelte';

	// Icons
	import ArrowRight from 'lucide-svelte/icons/arrow-right';

	// Types
	import type { PageData } from './$types';
	import { displayName } from '$lib/utils/displayUserName';
	import { MailOpen } from '@lucide/svelte';
	import type { Sandbox, User } from '@prisma/client';

	let { data }: { data: PageData } = $props();

	class SuperUserOpenClass {
		open = $state(false);
	}

	function generateMailToLink(user: User, sandbox: Sandbox) {
		const senderName = displayName(data.user);
		const receiverName = displayName(user);

		return `mailto:${user.email}?subject=${senderName}%20wants%20access%20to%20${sandbox.name}&body=Dear%20${receiverName}%2C%0A%0AI%20would%20like%20to%20receive%20editor%20access%20to%20the%20sandbox%20with%20the%20name%20${sandbox.name}%0A%0AWith%20kind%20regards%2C%0A${senderName}`;
	}
</script>

<section class="mx-auto !my-6 max-w-4xl space-y-2">
	<h2 class="w-full text-xl font-bold whitespace-nowrap text-purple-950">Your sandboxes</h2>

	{#each data.sandboxes as sandbox, i (sandbox.id)}
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
					<span>Owner:</span> <span>{displayName(sandbox.owner)}</span>
					<span>Graphs:</span> <span>{sandbox._count.graphs}</span>
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
						title="Users with admin or editor permissions"
						button="Permissions"
						icon="admins"
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

					<Table.Cell class="text-right">
						<Button
							disabled={data.user?.id == sandbox.owner.id}
							variant="outline"
							href={generateMailToLink(sandbox.owner, sandbox)}><MailOpen /></Button
						>
					</Table.Cell>
				</Table.Row>

				{#each sandbox.editors as user (user.id)}
					<Table.Row class="bg-purple-50/50 odd:bg-purple-100/50 hover:bg-purple-100/30">
						<Table.Cell>
							{displayName(user)}
						</Table.Cell>

						<Table.Cell>Editor</Table.Cell>

						<Table.Cell class="text-right">
							<Button
								disabled={data.user?.id == user.id}
								variant="outline"
								href={generateMailToLink(user, sandbox)}><MailOpen /></Button
							>
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
{/snippet}

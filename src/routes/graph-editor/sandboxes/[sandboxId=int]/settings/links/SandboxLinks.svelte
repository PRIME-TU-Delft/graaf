<script lang="ts">
	import { page } from '$app/state';
	import { cn } from '$lib/utils';

	// Components
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table/index.js';
	import GraphLinkSettings from './GraphLinkSettings.svelte';

	// Icons
	import { ArrowRight } from '@lucide/svelte';

	// Types
	import type { Sandbox, Graph, Lecture, Link } from '@prisma/client';
	import type { SandboxPermissions } from '$lib/utils/permissions';

	type SandboxLinksProps = {
		sandbox: Sandbox & SandboxPermissions & { graphs: Graph[] };
		graphs: (Graph & { lectures: Lecture[]; links: Link[] })[];
	};

	const { sandbox, graphs }: SandboxLinksProps = $props();
</script>

<section class="prose mx-auto p-4">
	<h2 class="mt-4 mb-0">Sandbox links</h2>

	<p>
		You can share graphs in this sandbox with other users. They will be able to view the shared
		graphs, but not edit them.
	</p>

	<div class="rounded-md border">
		<Table.Root class="m-0">
			<Table.Header>
				<Table.Row>
					<Table.Head>Name</Table.Head>
					<Table.Head class="w-10">Links</Table.Head>
					<Table.Head class="text-right">Actions</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each graphs as graph (graph.id)}
					<Table.Row>
						<Table.Cell class="font-medium">
							{graph.name}
						</Table.Cell>

						<Table.Cell class="text-center">
							{graph.links.length}
						</Table.Cell>

						<Table.Cell class="text-right">
							<GraphLinkSettings {graph} />
						</Table.Cell>
					</Table.Row>

					{#each graph.links as link (link.id)}
						{@render alias(link.name)}
					{/each}
				{:else}
					<Table.Row>
						<Table.Cell colspan={4} class="text-center">No graphs found.</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
</section>

{#snippet alias(linkName: string)}
	<Table.Row class={cn(['bg-purple-50/50 odd:bg-purple-100/50 hover:bg-purple-100/30'])}>
		<Table.Cell colspan={2}>
			{page.url.host}/graph/{sandbox.id}/{linkName}
		</Table.Cell>
		<Table.Cell class="text-right">
			<Button href={`/graph/${sandbox.id}/${linkName}`} variant="outline">
				Preview <ArrowRight class="h-4 w-4" />
			</Button>
		</Table.Cell>
	</Table.Row>
{/snippet}

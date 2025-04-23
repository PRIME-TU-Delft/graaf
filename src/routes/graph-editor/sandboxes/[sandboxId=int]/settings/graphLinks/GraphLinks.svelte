<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table/index.js';
	import { cn } from '$lib/utils';
	import { ArrowRight, Eye, EyeOff, Link as LinkIcon } from '@lucide/svelte';
	import LinkEmbedGraph from './LinkEmbedGraph.svelte';

	import type { Sandbox, Graph, Lecture, Link } from '@prisma/client';
	import type { SandboxPermissions } from '$lib/utils/permissions';

	type GraphLinksProps = {
		sandbox: Sandbox & SandboxPermissions & { graphs: Graph[]; links: Link[] };
		graphs: (Graph & { lectures: Lecture[]; links: Link[] })[];
	};

	const { sandbox, graphs }: GraphLinksProps = $props();
</script>

<section class="prose mx-auto p-4">
	<h2>Graph links</h2>
	<p>
		Graphs with some link is indecated with a <Eye
			class="border-sm inline size-6 rounded bg-blue-100 p-1"
		/> while graphs without links are indicated with an
		<EyeOff class="border-sm inline size-6 rounded bg-blue-100 p-1" />. A new graph link can be
		created in the <LinkIcon class="border-sm inline size-6 rounded bg-blue-100 p-1" /> settings panel.
		A graph can have multiple links and links can be moved between graphs. A link name needs to be unique
		within a course.
	</p>

	<Table.Root class="rounded-md border">
		<Table.Header>
			<Table.Row>
				<Table.Head>Name</Table.Head>
				<Table.Head class="w-10 text-center">Links</Table.Head>
				<Table.Head class="whitespace-nowrap">Embed/Link settings</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each graphs as graph (graph.id)}
				<Table.Row class="p-0">
					<Table.Cell class="flex items-center gap-1 py-3 font-medium">
						{#if graph.links.length > 0}
							<Eye class="border-sm inline size-6 rounded bg-blue-100 p-1" />
						{:else}
							<EyeOff class="border-sm inline size-6 rounded bg-blue-100 p-1" />
						{/if}
						{graph.name}
					</Table.Cell>
					<Table.Cell class="text-right">{graph.links.length || ''}</Table.Cell>
					<Table.Cell class="p-1 text-right">
						<LinkEmbedGraph {graph} {sandbox} />
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
</section>

{#snippet alias(linkName: string)}
	<Table.Row class={cn(['bg-purple-50/50 odd:bg-purple-100/50 hover:bg-purple-100/30'])}>
		<Table.Cell class="pl-8" colspan={2}>
			{page.url.host}/graph/{sandbox.id}/{linkName}
		</Table.Cell>
		<Table.Cell class="text-right" colspan={1}>
			<Button href={`/graph/${sandbox.id}/${linkName}`} variant="outline">
				Preview <ArrowRight class="h-4 w-4" />
			</Button>
		</Table.Cell>
	</Table.Row>
{/snippet}

<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table/index.js';
	import { cn } from '$lib/utils';
	import type { CoursePermissions } from '$lib/utils/permissions';
	import { ArrowRight, ChevronDown, Eye, EyeClosed } from '@lucide/svelte';
	import type { Course, Graph, Lecture, Link } from '@prisma/client';
	import EmbedGraph from './EmbedGraph.svelte';
	import GraphSettingsDialog from './GraphSettingsDialog.svelte';

	type GraphLinksProps = {
		course: Course & CoursePermissions & { links: Link[] };
		graphs: (Graph & { lectures: Lecture[]; links: Link[] })[];
	};

	const { course, graphs }: GraphLinksProps = $props();

	let showAlias = $state<number>();
</script>

<section class="prose mx-auto p-4">
	<h2>Graph links</h2>
	<p>
		Graphs with a link that is public are indecated with a <Eye
			class="border-sm inline size-6 rounded bg-blue-100 p-1"
		/> while private links are shown by
		<EyeClosed class="border-sm inline size-6 rounded bg-blue-100 p-1" />. Private means that the
		graph cannot be seen by students. Aliases can be added to have more links to the same graph.
		When a graph is private all aliases are also disabled.
	</p>

	<Table.Root class="rounded-md border">
		<Table.Header>
			<Table.Row>
				<Table.Head>Name</Table.Head>
				<Table.Head class="w-10 text-center">Aliases</Table.Head>
				<Table.Head class="w-10"></Table.Head>
				<Table.Head class="w-10"></Table.Head>
				<Table.Head class="w-10 text-right"></Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each graphs as graph, i (graph.id)}
				<Table.Row class="p-0">
					<Table.Cell class="flex items-center gap-1 py-3 font-medium">
						{#if graph.isVisible}
							<Eye class="border-sm inline size-6 rounded bg-blue-100 p-1" />
						{:else}
							<EyeClosed class="border-sm inline size-6 rounded bg-blue-100 p-1" />
						{/if}
						{graph.name}
					</Table.Cell>
					<Table.Cell class="items-center p-1">{@render aliasDropdown(graph)}</Table.Cell>
					<Table.Cell class="p-1">
						<EmbedGraph {graph} {course} />
					</Table.Cell>
					<Table.Cell class="p-1">
						<GraphSettingsDialog {graph} {course} />
					</Table.Cell>
					<Table.Cell class="p-1 text-right">
						<Button
							href={`/graph-editor/courses/${course.code}/graphs/${graph.id}`}
							variant="outline"
						>
							View <ArrowRight class="h-4 w-4" />
						</Button>
					</Table.Cell>
				</Table.Row>

				{#if showAlias == graph.id}
					{#each graph.links as link, i}
						{@render alias(link.name, graph, i % 2 == 0)}
					{/each}
				{/if}
			{:else}
				<Table.Row>
					<Table.Cell colspan={4} class="text-center">No graphs found.</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</section>

{#snippet aliasDropdown(graph: Graph & { links: Link[] })}
	{#if graph.links.length > 0}
		<Button
			variant="outline"
			disabled={!graph.isVisible}
			onclick={() => {
				if (showAlias == graph.id) showAlias = undefined;
				else showAlias = graph.id;
			}}
		>
			{graph.links.length}
			<ChevronDown
				class={cn(['h-4 w-4 rotate-0 transition-transform', showAlias == graph.id && 'rotate-180'])}
			/>
		</Button>
	{:else}
		<Button variant="outline" disabled>0</Button>
	{/if}
{/snippet}

{#snippet alias(linkName: string, graph: Graph, isOdd: boolean)}
	<Table.Row class={cn(['bg-blue-100/50 hover:bg-blue-100/30', isOdd && 'bg-blue-100/50'])}>
		<Table.Cell class="pl-8 " colspan={3}>
			{page.url.host}/graph/{course.code}/{linkName}
		</Table.Cell>
		<Table.Cell class="pl-8 " colspan={3}>
			<Button href={`/graph/${course.code}/${linkName}`} variant="outline">
				<ArrowRight class="h-4 w-4" />
			</Button>
		</Table.Cell>
	</Table.Row>
{/snippet}

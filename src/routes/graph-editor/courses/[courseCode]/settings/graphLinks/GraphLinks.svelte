<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table/index.js';
	import { cn } from '$lib/utils';
	import type { CoursePermissions } from '$lib/utils/permissions';
	import { ArrowRight } from '@lucide/svelte';
	import type { Course, Graph, Lecture, Link } from '@prisma/client';
	import GraphLinkSettings from './GraphLinkSettings.svelte';
	import LinkEmbedGraph from './LinkEmbedGraph.svelte';

	type GraphLinksProps = {
		course: Course & CoursePermissions & { graphs: Graph[]; links: Link[] };
		graphs: (Graph & { lectures: Lecture[]; links: Link[] })[];
	};

	const { course, graphs }: GraphLinksProps = $props();
</script>

<section class="prose mx-auto p-4">
	<h2>Graph links</h2>

	<Table.Root class="mt-0 rounded-md border">
		<Table.Header>
			<Table.Row>
				<Table.Head>Name</Table.Head>
				<Table.Head class="w-10 text-center">Embed/Links</Table.Head>
				<Table.Head class="w-10 whitespace-nowrap">Settings</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each graphs as graph (graph.id)}
				<Table.Row class="p-0">
					<Table.Cell class="flex items-center gap-1 py-3 font-medium">
						{graph.name}
					</Table.Cell>
					<Table.Cell class="p-1 text-right">
						<LinkEmbedGraph {graph} {course} hasAtLeastCourseEditPermissions />
					</Table.Cell>
					<Table.Cell class="p-1 text-right">
						<GraphLinkSettings {graph} {course} />
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
			{page.url.host}/graph/{course.code}/{linkName}
		</Table.Cell>
		<Table.Cell class="text-right" colspan={1}>
			<Button href={`/graph/${course.code}/${linkName}`} variant="outline">
				Preview <ArrowRight class="h-4 w-4" />
			</Button>
		</Table.Cell>
	</Table.Row>
{/snippet}

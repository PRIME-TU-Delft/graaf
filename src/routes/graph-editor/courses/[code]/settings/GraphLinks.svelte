<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table/index.js';
	import { cn } from '$lib/utils';
	import { ArrowRight, ChevronDown, Eye, EyeClosed, Link } from '@lucide/svelte';
	import type { Course, Graph } from '@prisma/client';

	type GraphLinksProps = {
		course: Course;
		graphs: Graph[];
	};

	const { course, graphs }: GraphLinksProps = $props();

	let showAlias = $state<number>();
</script>

<section class="prose mx-auto p-4">
	<h2>Graph links</h2>
	<p>
		Graphs that are their link is public are indecated with a <Eye
			class="border-sm inline size-6 rounded bg-blue-100 p-1"
		/> while private links are shown by
		<EyeClosed class="border-sm inline size-6 rounded bg-blue-100 p-1" />.
	</p>

	<Table.Root class="rounded-md border">
		<Table.Header>
			<Table.Row>
				<Table.Head>Name</Table.Head>
				<Table.Head class="w-10">Aliases</Table.Head>
				<Table.Head class="w-10">Link settings</Table.Head>
				<Table.Head class="w-10 text-right">Go to</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each graphs as graph, i (graph.id)}
				<Table.Row>
					<Table.Cell class="flex items-center gap-1 font-medium">{graph.name} <Eye /></Table.Cell>
					<Table.Cell>
						<Button
							variant="outline"
							onclick={() => {
								if (showAlias == graph.id) showAlias = undefined;
								else showAlias = graph.id;
							}}
						>
							3 <ChevronDown
								class={cn([
									'h-4 w-4 rotate-0 transition-transform',
									showAlias == graph.id && 'rotate-180'
								])}
							/>
						</Button>
					</Table.Cell>
					<Table.Cell>
						<Button variant="outline">
							<Link class="h-4 w-4" />
						</Button>
					</Table.Cell>
					<Table.Cell class="text-right">
						<Button
							href={`/graph-editor/courses/${course.code}/graphs/${graph.id}`}
							variant="outline"
						>
							<ArrowRight class="h-4 w-4" />
						</Button>
					</Table.Cell>
				</Table.Row>

				{#if showAlias == graph.id}
					{@render alias('test', false)}
					{@render alias('test-2', true)}
					{@render alias('show-all', false)}
				{/if}
			{:else}
				<Table.Row>
					<Table.Cell colspan={4} class="text-center">No graphs found.</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</section>

{#snippet alias(name: string, isOdd: boolean)}
	<Table.Row class={cn(['bg-blue-100/50 hover:bg-blue-100/30', isOdd && 'bg-blue-100/50'])}>
		<Table.Cell class="pl-8 " colspan={3}>graph/show-2</Table.Cell>
		<Table.Cell class="pl-8 " colspan={3}>
			<Button href={`/graph-editor/courses/${course.code}/graphs/${name}`} variant="outline">
				<ArrowRight class="h-4 w-4" />
			</Button>
		</Table.Cell>
	</Table.Row>
{/snippet}

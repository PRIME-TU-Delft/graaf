<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { cn } from '$lib/utils';
	import { Check, ChevronDown } from '@lucide/svelte';
	import type { Course, Graph, Lecture } from '@prisma/client';
	import type { EmbedState } from './GraphEmbedState.svelte';

	type GraphLinksProps = {
		graph: Graph & { lectures: Lecture[] };
		course: Course;
		aliases: string[];
		graphEmbedState: EmbedState;
	};

	const { graph, course, aliases, graphEmbedState }: GraphLinksProps = $props();

	const link = $derived.by(() => {
		if (!graphEmbedState.alias) return 'First select alias';
	});

	let selectViewOptions = $derived.by(() => {
		let options = ['Domains', 'Subjects'];

		if (graph.lectures.length > 0) {
			options = ['Lecture', ...options];
		}

		return options;
	});
</script>

<div class="grid grid-cols-2 gap-2">
	{#if aliases.length == 0}
		<p>Cannot embed graph because no alias is linked to this graph</p>
	{:else}
		<div class="space-y-1">
			<!-- Select alias -->
			{@render select('Alias', graphEmbedState.alias ?? '', aliases, graphEmbedState.selectAlias)}

			<!-- Select view mode -->
			{@render select('View', graphEmbedState.show, selectViewOptions, graphEmbedState.selectShow)}

			<!-- Show lecture -->
			{#if graph.lectures.length > 0 && graphEmbedState.show == 'Lecture'}
				{@render select(
					'Lecture',
					graphEmbedState.showLecture ?? '',
					graph.lectures.map((lecture) => lecture.name),
					graphEmbedState.selectShowLecture
				)}
			{/if}
		</div>

		<textarea readonly>{link}</textarea>
	{/if}
</div>

{#snippet select(name: string, value: string, values: string[], select: (value: string) => void)}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger
			class={cn(buttonVariants({ variant: 'outline' }), 'w-full justify-between')}
		>
			<p>{name}: {value}</p>
			<ChevronDown />
		</DropdownMenu.Trigger>
		<DropdownMenu.Content>
			{#each values as v}
				<DropdownMenu.Item onSelect={() => select(v)} class="justify-between">
					{v}
					<Check class={cn('size-4', v != value && 'text-transparent')} />
				</DropdownMenu.Item>
			{/each}
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/snippet}

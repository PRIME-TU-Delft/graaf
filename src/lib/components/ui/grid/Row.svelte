<script lang="ts" generics="Item extends { id: number }">
	import { cn } from '$lib/utils';
	import { getContext, type Snippet } from 'svelte';
	import { flip } from 'svelte/animate';
	import type { GridStateType } from './Grid.svelte';
	const flipDurationMs = 300;

	type Props = {
		class?: string;
		items: Item[];
		children: Snippet<[Item, number]>;
	};

	let gridTemplate = $state<string[]>();

	$effect(() => {
		const context = getContext<GridStateType>('grid-template');

		gridTemplate = context.columnTemplate;
	});

	const { class: classes, items, children }: Props = $props();
</script>

{#each items as item, index (item.id)}
	<div
		style="
    grid-template-columns: repeat({gridTemplate?.length}, 1fr); 
    grid-template-columns: subgrid; 
    grid-template-columns: {gridTemplate?.join(' ')};
    "
		class={cn(
			'col-span-full grid w-full divide-x divide-gray-200/20 bg-purple-50/50 outline-purple-500/50',
			classes
		)}
		animate:flip={{ duration: flipDurationMs }}
	>
		{@render children(item, index)}
	</div>
{/each}

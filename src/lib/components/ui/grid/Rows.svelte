<script lang="ts" generics="Item extends { id: number | string }">
	import { page } from '$app/state';
	import { cn } from '$lib/utils';
	import { getContext, type Snippet } from 'svelte';
	import { flip } from 'svelte/animate';
	import type { GridStateType } from './gridState.svelte';

	const flipDurationMs = 300;

	type Props = {
		class?: string;
		items: Item[];
		name: string;
		children: Snippet<[Item, number]>;
	};

	let gridTemplate = $state<string[]>();

	$effect(() => {
		const context = getContext<GridStateType>('grid-template');

		gridTemplate = context.columnTemplate;
	});

	const { class: classes, items, name, children }: Props = $props();
</script>

{#each items as item, index (item.id)}
	<div
		style="
    grid-template-columns: repeat({gridTemplate?.length}, 1fr); 
    grid-template-columns: subgrid; 
    grid-template-columns: {gridTemplate?.join(' ')};
    "
		class={cn(
			'col-span-full grid w-full divide-x divide-gray-200/20 bg-purple-50/50 outline-purple-500/50 transition-colors delay-300',
			page.url.hash == `#${name}-${item.id}` ? 'bg-purple-300' : 'bg-purple-300/0',
			classes
		)}
		id={name + '-' + item.id}
		animate:flip={{ duration: flipDurationMs }}
	>
		{@render children(item, index)}
	</div>
{/each}

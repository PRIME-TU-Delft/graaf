<script lang="ts" generics="Item extends { id: number }">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';
	import { dragHandleZone, type Item } from 'svelte-dnd-action';
	import { Row } from '.';

	type Props = {
		class?: string;
		items: Item[];
		onconsider: (e: CustomEvent<{ items: Item[] }>) => void;
		onfinalize: (e: CustomEvent<{ items: Item[] }>) => void;
		children: Snippet<[Item, number]>;
	};

	const {
		class: classes,
		items,
		onconsider,
		onfinalize,
		children: resizeChildren
	}: Props = $props();
</script>

<div
	class={cn('col-span-full grid w-full grid-cols-subgrid divide-y-2 !outline-none', classes)}
	use:dragHandleZone={{ items, flipDurationMs: 300 }}
	{onconsider}
	{onfinalize}
>
	<Row {items}>
		{#snippet children(domain, index)}
			{@render resizeChildren(domain, index)}
		{/snippet}
	</Row>
</div>

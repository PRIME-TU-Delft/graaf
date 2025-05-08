<script lang="ts" generics="Item extends { id: number }">
	import { cn } from '$lib/utils';
	import { MoveVertical } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import { dragHandle, dragHandleZone } from 'svelte-dnd-action';
	import { Cell, Rows } from '.';

	type Props = {
		class?: string;
		items: Item[];
		name: string;
		onconsider: (e: CustomEvent<{ items: Item[] }>) => void;
		onfinalize: (e: CustomEvent<{ items: Item[] }>) => void;
		children: Snippet<[Item, number]>;
	};

	const {
		class: classes,
		items,
		name,
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
	<Rows {items} {name}>
		{#snippet children(domain, index)}
			<Cell class="p-0">
				<div
					class="m-2 rounded bg-purple-200 p-2 transition-colors hover:bg-purple-400"
					use:dragHandle
					aria-label="drag-handle for {domain.id}"
				>
					<MoveVertical class="h-4 w-4" />
				</div>
			</Cell>

			{@render resizeChildren(domain, index)}
		{/snippet}
	</Rows>
</div>

<script lang="ts">
	import { page } from '$app/state';
	import { cn } from '$lib/utils';
	import { useSortable } from '@dnd-kit-svelte/sortable';
	import { GripVertical } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	type Props = {
		id: string | number;
		name: string;
		children: Snippet;
		after?: Snippet;
	};

	let { id, name, children, after }: Props = $props();

	const {
		attributes,
		listeners,
		node,
		activatorNode,
		transform,
		transition,
		isDragging,
		isSorting
	} = useSortable({
		id: id,
		data: { type: 'item' }
	});

	const style = $derived(`
		transform:translate3d(${transform.current?.x}px, ${transform.current?.y}px, 0);
		transition: ${isSorting.current ? transition.current : 'none'};
		z-index: ${isDragging.current ? 1 : 0};`);
</script>

<div
	id="{name}-{id}"
	bind:this={node.current}
	{style}
	class={cn('relative transition-transform', { invisible: isDragging.current })}
>
	<!-- Original element - becomes invisible during drag but maintains dimensions -->
	<div
		class={cn(
			'flex items-center gap-2 rounded px-2 transition-colors delay-300 focus-within:bg-amber-400/10',
			{
				'bg-purple-100': page.url.hash == `#${name}-${id}`
			}
		)}
	>
		<div
			class="cursor-move px-2 py-4 text-gray-500"
			bind:this={activatorNode.current}
			{...attributes.current}
			{...listeners.current}
		>
			<GripVertical />
		</div>

		{@render children()}
	</div>

	{@render after?.()}
</div>

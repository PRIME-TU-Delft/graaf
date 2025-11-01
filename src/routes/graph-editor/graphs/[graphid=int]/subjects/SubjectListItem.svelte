<script lang="ts">
	import { page } from '$app/state';
	import { cn } from '$lib/utils';
	import type { PrismaGraphPayload } from '$lib/validators/types';
	import { useSortable } from '@dnd-kit-svelte/sortable';
	import { GripVertical } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	type Props = {
		subject: PrismaGraphPayload['subjects'][number];
		children: Snippet;
	};

	let { subject, children }: Props = $props();

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
		id: subject.id,
		data: { type: 'item' }
	});

	const style = $derived(`
		transform:translate3d(${transform.current?.x}px, ${transform.current?.y}px, 0);
		transition: ${isSorting.current ? transition.current : 'none'};
		z-index: ${isDragging.current ? 1 : 0};`);
</script>

<div
	id="subject-{subject.id}"
	class="relative transition-transform select-none"
	bind:this={node.current}
	{style}
>
	<!-- Original element - becomes invisible during drag but maintains dimensions -->
	<div
		class={cn(
			'flex items-center gap-2 rounded px-2 transition-colors delay-300 focus-within:bg-amber-400/10',
			{
				invisible: isDragging.current,
				'bg-purple-100': page.url.hash == `#subject-${subject.id}`
			}
		)}
	>
		<div
			class="cursor-pointer px-2 py-4 text-gray-500"
			bind:this={activatorNode.current}
			{...attributes.current}
			{...listeners.current}
		>
			<GripVertical />
		</div>

		{@render children()}
	</div>
</div>

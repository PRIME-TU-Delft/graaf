<script lang="ts" generics="T">
	import { page } from '$app/state';
	import { draggable, droppable, type DragDropState } from '@thisux/sveltednd';
	import type { Snippet } from 'svelte';
	import { flip } from 'svelte/animate';
	import { fade } from 'svelte/transition';

	type Props = {
		list: T[];
		children: Snippet<[T, number]>;
		onrearrange?: (items: T[]) => void;
		useId: (item: T) => string;
	};

	let { list, children, onrearrange = () => {}, useId }: Props = $props();

	const items = $state(list);

	function handleDrop(state: DragDropState<T>) {
		const { draggedItem, targetContainer } = state;
		const dragIndex = items.findIndex((item) => useId(item) === useId(draggedItem));
		const dropIndex = parseInt(targetContainer ?? '0');

		if (dragIndex !== -1 && !isNaN(dropIndex)) {
			const [item] = items.splice(dragIndex, 1);
			items.splice(dropIndex, 0, item);
			onrearrange(items);
		}
	}
</script>

{#each items as item, index (useId(item))}
	{@const id = useId(item)}
	<tr
		{id}
		use:draggable={{ container: index.toString(), dragData: item, interactive: ['.interactive'] }}
		use:droppable={{
			container: index.toString(),
			callbacks: { onDrop: handleDrop }
		}}
		class={[
			'transition-colors delay-300',
			page.url.hash == `#${id}` ? 'bg-blue-200' : 'bg-blue-200/0'
		]}
		animate:flip={{ duration: 300 }}
		in:fade={{ duration: 150 }}
		out:fade={{ duration: 150 }}
		draggable="true"
	>
		{@render children(item, index)}
	</tr>
{/each}

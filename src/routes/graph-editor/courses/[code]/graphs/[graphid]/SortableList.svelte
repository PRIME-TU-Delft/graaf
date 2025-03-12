<script lang="ts" generics="T">
	import { page } from '$app/state';
	import { draggable, droppable, type DragDropState } from '@thisux/sveltednd';
	import type { Snippet } from 'svelte';
	import { flip } from 'svelte/animate';
	import { fade } from 'svelte/transition';

	type Props<T> = {
		list: T[];
		children: Snippet<[T, number]>;
		onrearrange?: (items: T[]) => void;
		useId: (item: T) => string;
	};

	let { list = $bindable(), children, onrearrange = () => {}, useId }: Props<T> = $props();

	function handleDrop(state: DragDropState<T>) {
		const { draggedItem, targetContainer } = state;
		const dragIndex = list.findIndex((item) => useId(item) === useId(draggedItem));
		const dropIndex = parseInt(targetContainer ?? '0');

		if (dragIndex !== -1 && !isNaN(dropIndex)) {
			const newList = [...list];
			const [item] = newList.splice(dragIndex, 1);
			newList.splice(dropIndex, 0, item);
			list = newList;
			onrearrange(list);
		}
	}
</script>

{#each list as item, index (useId(item))}
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
		{@render children({ ...item }, index)}
	</tr>
{/each}

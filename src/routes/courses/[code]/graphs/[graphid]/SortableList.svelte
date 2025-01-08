<script lang="ts" generics="T extends object">
	import type { Snippet } from 'svelte';

	const DROPZONE = 5;

	type DE = (e: DragEvent) => void;

	type Props = {
		list: T[];
		id: keyof T;
		sortItems: Snippet<[T, number, DE, DE, DE]>;
		onrearange?: (list: T[]) => void;
	};

	let { list = $bindable(), id, sortItems, onrearange = () => {} }: Props = $props();

	let origin: number | null = $state(null); // Index of the element being dragged

	function getDataset(node: any) {
		if (!node.dataset.index) {
			return getDataset(node.parentElement);
		} else {
			return { ...node.dataset };
		}
	}

	function onDragStart(event: DragEvent) {
		const target = event.target as HTMLElement;
		const data = getDataset(target);

		origin = data.index;
	}

	function onDragOver(event: DragEvent) {
		event.preventDefault();

		const target = event.target as HTMLElement;
		const data = getDataset(target);

		if (
			origin === null || // Not dragging (very strange case)
			data.index === origin || // Dragging over itself
			(data.index > origin && event.offsetY < target.clientHeight - DROPZONE) || // Dragging down, but not close enough
			(data.index < origin && event.offsetY > DROPZONE) // Dragging up, but not close enough
		)
			return;

		rearrange(origin, data.index);
		origin = data.index;
	}

	function onDragEnd(_: DragEvent) {
		onrearange(list);
		// dispatch('rearrange', list)
		origin = null;
	}

	function rearrange(from: number, to: number) {
		const new_list = [...list] as T[];
		const moved = new_list.splice(from, 1);
		new_list.splice(to, 0, moved[0]);
		list = new_list;
	}
</script>

{#each list as item, index (item[id])}
	{@render sortItems(item, index, onDragOver, onDragStart, onDragEnd)}
{/each}

<script lang="ts">
	import { MoveVertical } from '@lucide/svelte';
	import { dragHandle, dragHandleZone } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';

	type Item = {
		id: number;
		name: string;
		color: string;
	};

	let items: Item[] = [
		{ id: 1, name: 'item1', color: 'red' },
		{ id: 2, name: 'item2', color: 'blue' },
		{ id: 3, name: 'item3', color: 'green' },
		{ id: 4, name: 'item4', color: 'yellow' }
	];
	const flipDurationMs = 300;
	function handleDndConsider(e: CustomEvent<{ items: Item[] }>) {
		items = e.detail.items;
	}
	function handleDndFinalize(e: CustomEvent<{ items: Item[] }>) {
		items = e.detail.items;
	}
</script>

<div class="mt-2 grid grid-cols-4 overflow-hidden rounded border-2 border-gray-500">
	<div
		class="col-span-4 grid grid-cols-subgrid divide-x-2 divide-gray-500 bg-gray-200 font-mono font-bold"
	>
		<div class="p-2"></div>
		<div class="p-2">Name</div>
		<div class="p-2">Style</div>
		<div class="p-2 text-right">Settings</div>
	</div>

	<div
		class="col-span-4 grid grid-cols-subgrid divide-y-2 bg-gray-50 !outline-none"
		use:dragHandleZone={{ items, flipDurationMs }}
		onconsider={handleDndConsider}
		onfinalize={handleDndFinalize}
	>
		{#each items as item (item.id)}
			<div
				class="col-span-4 grid w-full grid-cols-4 divide-x divide-gray-200 odd:bg-gray-50 even:bg-gray-100"
				animate:flip={{ duration: flipDurationMs }}
			>
				<div
					class="w-12 rounded bg-purple-50 p-3"
					use:dragHandle
					aria-label="drag-handle for {item.name}"
				>
					<MoveVertical />
				</div>

				<p>{item.name}</p>

				<p>{item.color}</p>

				<p>...</p>
			</div>
		{/each}
	</div>
</div>

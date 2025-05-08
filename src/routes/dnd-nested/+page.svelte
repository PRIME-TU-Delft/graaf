<script lang="ts">
	import { MoveVertical } from '@lucide/svelte';
	import { dragHandle, dragHandleZone, type DndEvent } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import Lecture from './Lecture.svelte';
	import type { LectureType } from './types';

	let lectures: LectureType[] = $state([
		{
			id: 1,
			name: 'Lecture 1',
			subjects: [
				{ id: 1, name: 'Subject 1' },
				{ id: 2, name: 'Subject 2' }
			]
		},
		{
			id: 2,
			name: 'Lecture 2',
			subjects: [
				{ id: 3, name: 'Subject 3' },
				{ id: 4, name: 'Subject 4' }
			]
		}
	]);

	const flipDurationMs = 300;

	function handleDndConsider(e: CustomEvent<DndEvent<LectureType>>): void {
		lectures = e.detail.items;
	}

	function handleDndFinalize(e: CustomEvent<DndEvent<LectureType>>): void {
		lectures = e.detail.items;
	}
</script>

<div
	class="container space-y-2 bg-red-300 p-2"
	use:dragHandleZone={{ items: lectures, flipDurationMs, type: 'lecture' }}
	onconsider={handleDndConsider}
	onfinalize={handleDndFinalize}
>
	{#each lectures as lecture, index (lecture.id)}
		<div class="bg-green-300 p-2" animate:flip={{ duration: flipDurationMs }}>
			<div class="flex w-full items-center justify-between">
				<div
					class="w-12 rounded bg-purple-50 p-3"
					use:dragHandle
					aria-label="drag-handle for {lecture.name}"
				>
					<MoveVertical />
				</div>

				<p>{lecture.name}</p>

				<p>...</p>
			</div>

			<Lecture bind:lecture={lectures[index]} />
		</div>
	{/each}
</div>

<script lang="ts">
	import { ArrowRight, MoveVertical } from '@lucide/svelte';
	import { dragHandle, dragHandleZone, type DndEvent } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import type { SubjectType } from './types';

	type Props = {
		lecture: {
			id: number;
			name: string;
			subjects: {
				id: number;
				name: string;
			}[];
		};
	};

	const { lecture = $bindable() }: Props = $props();

	const flipDurationMs = 300;

	function handleDndConsider(e: CustomEvent<DndEvent<SubjectType>>): void {
		lecture.subjects = e.detail.items;
	}

	function handleDndFinalize(e: CustomEvent<DndEvent<SubjectType>>): void {
		lecture.subjects = e.detail.items;
	}
</script>

<div
	class="min-h-12 space-y-2 bg-yellow-300 p-2"
	use:dragHandleZone={{ items: lecture.subjects, flipDurationMs, type: 'subject' }}
	onconsider={handleDndConsider}
	onfinalize={handleDndFinalize}
>
	{#each lecture.subjects as subject (subject.id)}
		<div class="bg-yellow-400 p-2" animate:flip={{ duration: flipDurationMs }}>
			<div class="flex w-full items-center justify-between">
				<div
					class="w-12 rounded bg-purple-50 p-3"
					use:dragHandle
					aria-label="drag-handle for {subject.name}"
				>
					<MoveVertical />
				</div>

				<p class="flex">{lecture.name} <ArrowRight /> {subject.name}</p>

				<p>...</p>
			</div>
		</div>
	{:else}
		<div class="bg-red-400 p-2">
			<p>...</p>
		</div>
	{/each}
</div>

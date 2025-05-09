<script lang="ts">
	import { ArrowRight, MoveVertical, Plus } from '@lucide/svelte';
	import type { Lecture, Subject } from '@prisma/client';
	import { dragHandle, dragHandleZone, type DndEvent } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';

	type Props = {
		lecture: Lecture & {
			subjects: Subject[];
		};
	};

	const { lecture = $bindable() }: Props = $props();

	const flipDurationMs = 300;

	function handleDndConsider(e: CustomEvent<DndEvent<Subject>>): void {
		lecture.subjects = e.detail.items;
	}

	function handleDndFinalize(e: CustomEvent<DndEvent<Subject>>): void {
		lecture.subjects = e.detail.items;
	}
</script>

<div
	class="min-h-8 space-y-2 rounded bg-purple-100 p-1 !outline-purple-400"
	use:dragHandleZone={{ items: lecture.subjects, flipDurationMs, type: 'subject' }}
	onconsider={handleDndConsider}
	onfinalize={handleDndFinalize}
>
	{#each lecture.subjects as subject (subject.id)}
		<div animate:flip={{ duration: flipDurationMs }} class="!outline-purple-50">
			<div
				class="flex w-full items-center justify-between rounded bg-purple-50/30 backdrop-blur-sm"
			>
				<div
					class="m-2 rounded bg-purple-300 p-2 transition-colors hover:bg-purple-400"
					use:dragHandle
					aria-label="drag-handle for {lecture.id}"
				>
					<MoveVertical class="h-4 w-4" />
				</div>

				<p class="m-0 flex items-center gap-1">
					{lecture.name}
					<ArrowRight class="size-4" />
					{subject.name}
				</p>

				<p class="m-0 p-2">...</p>
			</div>
		</div>
	{:else}
		<p class="m-0 items-center">
			Add subject by clicking the <span
				class="border-sm h-6 gap-1 text-xs rounded bg-purple-200 p-1 inline-flex items-center"
				><Plus class="size-3" /> Edit Subjects</span
			>, or by dragging another lecture's subject into this field
		</p>
	{/each}
</div>

<script lang="ts">
	import * as Menubar from '$lib/components/ui/menubar/index.js';
	import { Ellipsis, MoveVertical } from '@lucide/svelte';
	import { dragHandle, dragHandleZone, type DndEvent } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import type { PageData } from './$types';
	import AddSubjectToLecture from './AddSubjectToLecture.svelte';
	import CreateNewLecture from './CreateNewLecture.svelte';
	import LectureSubject from './LectureSubject.svelte';

	let { data }: { data: PageData } = $props();

	const flipDurationMs = 300;

	// This is a workaround for the fact that we can't use $derived due to the reordering from the svelte-dnd-action library
	let lectures = $state(data.course.graphs[0].lectures);
	$effect(() => {
		lectures = data.course.graphs[0].lectures;
	});

	function handleDndConsider(e: CustomEvent<DndEvent<(typeof lectures)[number]>>): void {
		lectures = e.detail.items;
	}

	function handleDndFinalize(e: CustomEvent<DndEvent<(typeof lectures)[number]>>): void {
		// TODO: add actual logic to update the lecture subjects
		lectures = e.detail.items;
	}
</script>

<CreateNewLecture graph={data.course.graphs[0]} />

<div
	class="space-y-3 rounded !outline-purple-300"
	use:dragHandleZone={{ items: lectures, flipDurationMs, type: 'lecture' }}
	onconsider={handleDndConsider}
	onfinalize={handleDndFinalize}
>
	{#each lectures as lecture, index (lecture.id)}
		<div
			animate:flip={{ duration: flipDurationMs }}
			class="rounded bg-purple-50/30 !outline-2 !outline-purple-500 !backdrop-blur-lg"
		>
			<div class="flex w-full items-center justify-between gap-2">
				<div
					class="m-2 rounded bg-purple-200 p-2 transition-colors hover:bg-purple-400"
					use:dragHandle
					aria-label="drag-handle for {lecture.id}"
				>
					<MoveVertical class="h-4 w-4" />
				</div>
				<p class="m-0 mr-auto text-lg font-bold">{lecture.name}</p>

				<AddSubjectToLecture {lecture} graph={data.course.graphs[0]} />

				<Menubar.Root>
					<Menubar.Menu value="menu">
						<Menubar.Trigger class="h-full w-full">
							<Ellipsis class="size-4 w-full" />
						</Menubar.Trigger>
						<Menubar.Content>
							<Menubar.Item disabled>Edit</Menubar.Item>

							<Menubar.Sub>
								<Menubar.SubTrigger disabled class="font-bold text-red-700 hover:bg-red-100">
									Delete
								</Menubar.SubTrigger>
								<Menubar.SubContent class="ml-1 w-32">Yes, delete this lecture</Menubar.SubContent>
							</Menubar.Sub>
						</Menubar.Content>
					</Menubar.Menu>
				</Menubar.Root>
			</div>

			<LectureSubject bind:lecture={lectures[index]} />
		</div>
	{:else}
		<p class="mt-2 w-full p-3 text-center text-sm text-gray-500">
			No lectures found, create one with the button in the top right
		</p>
	{/each}
</div>

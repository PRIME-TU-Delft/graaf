<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { cn } from '$lib/utils';
	import { Ellipsis, MoveVertical } from '@lucide/svelte';
	import { dragHandle, dragHandleZone, type DndEvent } from 'svelte-dnd-action';
	import { toast } from 'svelte-sonner';
	import { flip } from 'svelte/animate';
	import type { PageData } from './$types';
	import AddSubjectToLecture from './AddSubjectToLecture.svelte';
	import ChangeLecture from './ChangeLecture.svelte';
	import CreateNewLecture from './CreateNewLecture.svelte';
	import DeleteLecture from './DeleteLecture.svelte';
	import LectureSubject from './LectureSubject.svelte';

	let { data }: { data: PageData } = $props();

	class ChangeLectureClass {
		open = $state(false);
	}

	const flipDurationMs = 300;

	// This is a workaround for the fact that we can't use $derived due to the reordering from the svelte-dnd-action library
	let lectures = $state(data.graph.lectures);
	$effect(() => {
		lectures = data.graph.lectures;
	});

	function handleDndConsider(e: CustomEvent<DndEvent<(typeof lectures)[number]>>) {
		lectures = e.detail.items;
	}

	async function handleDndFinalize(e: CustomEvent<DndEvent<(typeof lectures)[number]>>) {
		lectures = e.detail.items;

		const body = lectures.map((lecture, index) => ({
			lectureId: lecture.id,
			newOrder: index
		}));

		const response = await fetch('/api/lectures/order', {
			method: 'PATCH',
			body: JSON.stringify(body),
			headers: { 'content-type': 'application/json' }
		});

		if (!response.ok) {
			lectures = lectures.toSorted((a, b) => a.order - b.order);

			toast.error('Error while reordering lectures');
		} else {
			lectures.forEach((lecture, index) => {
				lecture.order = index;
			});
		}
	}
</script>

<CreateNewLecture graph={data.graph} />

<div
	class="space-y-3 rounded !outline-purple-300"
	use:dragHandleZone={{ items: lectures, flipDurationMs, type: 'lecture' }}
	onconsider={handleDndConsider}
	onfinalize={handleDndFinalize}
>
	{#each lectures as lecture, index (lecture.id)}
		{@const changeLecture = new ChangeLectureClass()}

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

				{#if data.graph.subjects.length > 0}
					{#key lecture.subjects}
						<AddSubjectToLecture {lecture} graph={data.graph} />
					{/key}
				{/if}

				<DropdownMenu.Root bind:open={changeLecture.open}>
					<DropdownMenu.Trigger class={cn(buttonVariants({ variant: 'outline' }))}>
						<Ellipsis class="size-4 w-full" />
					</DropdownMenu.Trigger>
					<DropdownMenu.Content>
						<DropdownMenu.Item class="p-0">
							<ChangeLecture
								{lecture}
								graph={data.graph}
								onSuccess={() => (changeLecture.open = false)}
							/>
						</DropdownMenu.Item>

						<DropdownMenu.Sub>
							<DropdownMenu.SubTrigger class="font-bold text-red-700 hover:bg-red-100">
								Delete
							</DropdownMenu.SubTrigger>
							<DropdownMenu.SubContent class="ml-1 w-40">
								<DeleteLecture
									{lecture}
									graph={data.graph}
									onSuccess={() => (changeLecture.open = false)}
								/>
							</DropdownMenu.SubContent>
						</DropdownMenu.Sub>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>

			<LectureSubject bind:lecture={lectures[index]} subjects={data.graph.subjects} />
		</div>
	{:else}
		<p class="mt-2 w-full p-3 text-center text-sm text-gray-500">
			No lectures found, create one with the button in the top right
		</p>
	{/each}
</div>

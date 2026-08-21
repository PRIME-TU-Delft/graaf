<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { cn } from '$lib/utils';
	import { getGraphStore } from '$lib/graph/graphStore.svelte';
	import { Ellipsis, MoveVertical } from '@lucide/svelte';
	import { dragHandle, dragHandleZone } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import IssueIndicator from '../IssueIndicator.svelte';
	import AddSubjectToLecture from './AddSubjectToLecture.svelte';
	import ChangeLecture from './ChangeLecture.svelte';
	import CreateNewLecture from './CreateNewLecture.svelte';
	import DeleteLecture from './DeleteLecture.svelte';
	import LectureSubject from './LectureSubject.svelte';

	// The graph store owns this graph: the list reads its projection, and reordering lectures (or
	// moving a subject between them) goes through its mutations, which also keep the preview canvas
	// in step.
	const store = getGraphStore();
	const graph = $derived(store.graph);
	const issues = $derived(store.issues);

	class ChangeLectureClass {
		open = $state(false);
	}

	const flipDurationMs = 300;

	function idsOf(items: { id: number }[]) {
		return items.map((item) => item.id);
	}
</script>

<svelte:head>
	<title>{graph.name} Lectures | PRIME Graph Editor</title>
</svelte:head>

<CreateNewLecture {graph} />

<div
	class="space-y-3 rounded !outline-purple-300"
	use:dragHandleZone={{ items: graph.lectures, flipDurationMs, type: 'lecture' }}
	onconsider={(e) => store.previewOrder('lectures', idsOf(e.detail.items))}
	onfinalize={(e) => store.commitLectureOrder(idsOf(e.detail.items))}
>
	{#each graph.lectures as lecture (lecture.id)}
		{@const changeLecture = new ChangeLectureClass()}
		{@const lectureIssues = issues.lectureIssues[lecture.id] || { lecture: [], subjects: {} }}

		<div
			animate:flip={{ duration: flipDurationMs }}
			class="rounded bg-purple-50/30 !backdrop-blur-lg"
		>
			<div class="flex w-full items-center justify-between gap-2 p-2">
				<div
					class="rounded bg-purple-200 p-2 transition-colors hover:bg-purple-400"
					use:dragHandle
					aria-label="drag-handle for {lecture.id}"
				>
					<MoveVertical class="h-4 w-4" />
				</div>

				<p class="m-0 mr-auto text-lg font-bold">{lecture.name}</p>
				<IssueIndicator issues={lectureIssues.lecture} />

				{#if graph.subjects.length > 0}
					{#key lecture.subjects}
						<AddSubjectToLecture {lecture} {graph} />
					{/key}
				{/if}

				<DropdownMenu.Root bind:open={changeLecture.open}>
					<DropdownMenu.Trigger class={cn(buttonVariants({ variant: 'outline' }))}>
						<Ellipsis class="size-4 w-full" />
					</DropdownMenu.Trigger>
					<DropdownMenu.Content>
						<DropdownMenu.Item class="p-0">
							<ChangeLecture {lecture} {graph} onSuccess={() => (changeLecture.open = false)} />
						</DropdownMenu.Item>

						<DropdownMenu.Sub>
							<DropdownMenu.SubTrigger class="font-bold text-red-700 hover:bg-red-100">
								Delete
							</DropdownMenu.SubTrigger>
							<DropdownMenu.SubContent class="ml-1 w-40">
								<DeleteLecture {lecture} {graph} onSuccess={() => (changeLecture.open = false)} />
							</DropdownMenu.SubContent>
						</DropdownMenu.Sub>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>

			<LectureSubject {lecture} subjects={graph.subjects} issues={lectureIssues.subjects} />
		</div>
	{:else}
		<p class="mt-2 w-full p-3 text-center text-sm text-gray-500">
			No lectures found, create one with the button in the top right
		</p>
	{/each}
</div>

<script lang="ts">
	import DialogButton from '$lib/components/DialogButton.svelte';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import type { Graph } from '@prisma/client';
	import DuplicateGraph, { type CourseType } from './DuplicateGraph.svelte';
	import GraphSettings from './GraphSettings.svelte';
	import { page } from '$app/state';

	type EditGraphProps = {
		graph: Graph;
		course: CourseType;
		coursesAccessible: Promise<CourseType[]>;
	};

	let { graph, course, coursesAccessible }: EditGraphProps = $props();

	let isGraphSettingsOpen = $state(false);
	let isDuplicateOpen = $state(false);
	let graphIsVisisble = $state(false);

	function handleOpenGraphSettings(e: MouseEvent) {
		e.preventDefault();
		isGraphSettingsOpen = true;
	}

	function handleOpenDuplicate(e: MouseEvent) {
		e.preventDefault();
		isDuplicateOpen = true;
	}
</script>

<div class="flex flex-col gap-1 lg:flex-row">
	<DialogButton
		onclick={(e) => handleOpenDuplicate(e)}
		button="Duplicate"
		title="Duplicate/Move Graph"
		description="Copy this graph within this or another course. This will create a new graph with the same content in the selected course."
		bind:open={isDuplicateOpen}
		class="grow"
	>
		<DuplicateGraph {graph} {course} {coursesAccessible} bind:isDuplicateOpen />
	</DialogButton>

	<DialogButton
		onclick={(e) => handleOpenGraphSettings(e)}
		button="Settings"
		title="Edit Graph"
		description="TODO"
		bind:open={isGraphSettingsOpen}
	>
		<h3 class="text-xl">Graph links</h3>
		<div class="mb-2 flex items-center space-x-2 p-2">
			<Checkbox id="is-visible" bind:checked={graphIsVisisble} />
			<Label for="is-visible" class="text-sm font-medium leading-none">
				Graph is {graphIsVisisble ? '' : 'not'} visible to students
			</Label>

			{#if graphIsVisisble}
				<Input disabled value="{page.url.host}/graphs/{course.code}/{graph.id}" />
			{/if}
		</div>

		<GraphSettings {graph} bind:isGraphSettingsOpen />
	</DialogButton>
</div>

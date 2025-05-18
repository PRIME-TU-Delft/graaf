<script lang="ts">
	import DialogButton from '$lib/components/DialogButton.svelte';
	import type { CoursePermissions } from '$lib/utils/permissions';
	import type { Course, Graph, Lecture, Link } from '@prisma/client';
	import DuplicateGraph, { type CourseType } from './DuplicateGraph.svelte';

	type EditGraphProps = {
		course: Course &
			CoursePermissions & {
				graphs: Graph[];
				links: Link[];
			};
		graph: Graph & {
			lectures: Lecture[];
			links: Link[];
		};
		coursesAccessible: Promise<CourseType[]>;
	};

	let { graph, course, coursesAccessible }: EditGraphProps = $props();

	let isDuplicateOpen = $state(false);

	function handleOpenDuplicate(e: MouseEvent) {
		e.preventDefault();
		isDuplicateOpen = true;
	}
</script>

<div class="flex flex-col gap-1 lg:flex-row">
	<DialogButton
		onclick={(e) => handleOpenDuplicate(e)}
		button="Duplicate"
		icon="copy"
		title="Duplicate/Move Graph"
		description="Copy this graph within this or another course. This will create a new graph with the same content in the selected course."
		bind:open={isDuplicateOpen}
		class="grow"
	>
		<DuplicateGraph {graph} {course} {coursesAccessible} bind:isDuplicateOpen />
	</DialogButton>
</div>

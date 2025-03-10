<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import type { Course, Program } from '@prisma/client';
	import type { RowSelectionState } from '@tanstack/table-core';
	import { fade, fly } from 'svelte/transition';

	type DataTableProps = {
		program: Program & { courses: Course[] };
		rowSelection: RowSelectionState;
	};

	let { program, rowSelection }: DataTableProps = $props();

	const selectedCourses = $derived(
		Object.keys(rowSelection)
			.map(Number)
			.map((i) => program.courses[i])
	);

	$inspect(selectedCourses);
</script>

<div in:fly={{ y: 10 }}>
	<form action="?/unlink-courses" method="POST">
		<input type="text" name="programId" value={program.id} hidden />

		<Button variant="destructive">Unlink {selectedCourses.length} courses from program</Button>
	</form>
</div>

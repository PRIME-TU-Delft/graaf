<script lang="ts">
	import * as Field from '$lib/components/ui/field/index.js';
	import type { Graph, Lecture } from '@prisma/client';
	import { toast } from 'svelte-sonner';
	import { getGraph } from '../../graph.remote';
	import { deleteLecture } from './lecture.remote';

	type Props = {
		lecture: Lecture;
		graph: Graph;
		onSuccess: () => void;
	};

	const { lecture, graph, onSuccess }: Props = $props();
</script>

<form
	{...deleteLecture.enhance(async ({ submit }) => {
		try {
			await submit().updates(getGraph(graph.id));
			if (deleteLecture.fields.allIssues()?.length) return;
			onSuccess();

			toast.success('Lecture deleted successfully!');
		} catch (e) {
			toast.error(JSON.stringify(e));
		}
	})}
>
	<input hidden {...deleteLecture.fields.graphId.as('number')} value={graph.id} />
	<input hidden {...deleteLecture.fields.lectureId.as('number')} value={lecture.id} />

	<p class="px-2 font-bold">Are you sure?</p>

	<Field.Submit
		form={deleteLecture}
		oncancel={onSuccess}
		submitTitle="Delete Lecture"
		loadingTitle=""
	/>
</form>

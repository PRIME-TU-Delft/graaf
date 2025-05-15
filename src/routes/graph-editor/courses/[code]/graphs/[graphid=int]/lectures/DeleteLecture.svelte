<script lang="ts">
	import { page } from '$app/state';
	import * as Form from '$lib/components/ui/form/index.js';
	import { deleteLectureSchema } from '$lib/zod/lectureSchema';
	import type { Graph, Lecture, Subject } from '@prisma/client';
	import { useId } from 'bits-ui';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import type { PageData } from './$types';

	type Props = {
		lecture: Lecture & {
			subjects: Subject[];
		};
		graph: Graph & { subjects: Subject[] };
		onSuccess: () => void;
	};

	const { lecture, graph, onSuccess }: Props = $props();

	const form = superForm((page.data as PageData).deleteLectureForm, {
		id: 'change-lecture-form-' + useId(),
		validators: zodClient(deleteLectureSchema),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('lectures successfully deleted!');
				onSuccess();
			}
		}
	});

	const { form: formData, enhance, submitting, delayed } = form;

	$effect(() => {
		if (lecture) {
			$formData.lectureId = lecture.id;
			$formData.graphId = graph.id;
		}
	});
</script>

<form action="?/delete-lecture" method="POST" use:enhance>
	<input type="hidden" name="lectureId" value={lecture.id} />
	<input type="hidden" name="graphId" value={graph.id} />

	<p class="px-2 font-bold">Are you sure?</p>

	<div class="mt-4 flex w-full justify-end">
		<Form.FormButton
			class="w-full"
			variant={'destructive'}
			disabled={$submitting}
			loading={$delayed}
			loadingMessage="Changing lecture..."
		>
			Yes delete lecture
		</Form.FormButton>
	</div>
</form>

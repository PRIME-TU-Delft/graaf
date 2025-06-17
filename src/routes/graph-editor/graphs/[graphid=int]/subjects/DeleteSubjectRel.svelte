<script lang="ts">
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';

	import { page } from '$app/state';
	import { buttonVariants } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import { Trash2 } from '@lucide/svelte';
	import type { Subject } from '@prisma/client';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { superForm } from 'sveltekit-superforms/client';
	import { type PageData } from './$types';
	import { toast } from 'svelte-sonner';
	import { subjectRelSchema } from '$lib/zod/subjectSchema';

	type Props = {
		sourceSubject: Subject;
		targetSubject: Subject;
		graph: PageData['graph'];
	};

	let { graph, sourceSubject, targetSubject }: Props = $props();

	const id = $props.id();

	const form = superForm((page.data as PageData).newSubjectRelForm, {
		id: id,
		validators: zodClient(subjectRelSchema),
		onResult: ({ result }) => {
			console.log({ result });
			if (result.type == 'success') {
				toast.success('Subject relationship deleted successfully!');
			}
		}
	});

	const { form: formData, enhance, submitting, delayed } = form;

	$effect(() => {
		// When the source or target subject changes, update the form data
		if (sourceSubject && targetSubject) {
			$formData.sourceSubjectId = sourceSubject.id;
			$formData.targetSubjectId = targetSubject.id;
			$formData.graphId = graph.id;
		}
	});
</script>

<Popover.Root>
	<Popover.Trigger class={cn(buttonVariants({ variant: 'destructive' }))}>
		<Trash2 />
	</Popover.Trigger>
	<Popover.Content side="right" class="space-y-1">
		<form action="?/delete-subject-rel" method="POST" use:enhance>
			<input type="hidden" name="graphId" value={graph.id} />
			<input type="hidden" name="sourceSubjectId" value={sourceSubject.id} />
			<input type="hidden" name="targetSubjectId" value={targetSubject.id} />

			<p class="mb-2">Are you sure you would like to delete this relationship</p>
			<Form.FormButton
				variant="destructive"
				disabled={$submitting}
				loading={$delayed}
				loadingMessage="Delete relationship..."
			>
				Yes, delete
			</Form.FormButton>
		</form>
	</Popover.Content>
</Popover.Root>

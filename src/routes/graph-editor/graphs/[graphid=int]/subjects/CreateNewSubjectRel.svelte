<script lang="ts">
	import { page } from '$app/state';
	import { buttonVariants } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Popover from '$lib/components/ui/popover';
	import { cn } from '$lib/utils';
	import { subjectRelSchema } from '$lib/zod/subjectSchema';
	import type { Graph, Subject } from '@prisma/client';
	import { useId } from 'bits-ui';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import Plus from 'lucide-svelte/icons/plus';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import type { PageData } from './$types';
	import SubjectRelField from './SubjectRelField.svelte';
	import DialogButton from '$lib/components/DialogButton.svelte';

	type Props = {
		graph: Graph & { subjects: Subject[] };
	};

	const { graph }: Props = $props();

	let dialogOpen = $state(false);
	const form = superForm((page.data as PageData).newSubjectRelForm, {
		id: 'subjectRelForm' + useId(),
		validators: zodClient(subjectRelSchema),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('Subject created successfully!');
				dialogOpen = false;
			}
		}
	});

	const { form: formData, enhance, submitting, delayed } = form;

	const isTheSameSubject = $derived(
		$formData.sourceSubjectId == $formData.targetSubjectId && $formData.sourceSubjectId != 0
	);
</script>

<div class="sticky top-2 z-10 mt-12 flex justify-between">
	<h2 class="m-0 flex items-center">Relationships</h2>
	<DialogButton
		bind:open={dialogOpen}
		icon="plus"
		button="New Relationship"
		title="Create Relationship"
		description="Relationships connect subjects to each other."
	>
		<form action="?/add-subject-rel" method="POST" use:enhance>
			<input type="hidden" name="graphId" value={graph.id} />

			<SubjectRelField id="sourceSubjectId" subjects={graph.subjects} {form} {formData} />
			<SubjectRelField id="targetSubjectId" subjects={graph.subjects} {form} {formData} />

			<Form.FormError {form} />

			<div class="w-full flex justify-end items-center">
				<Form.FormButton
					loading={$delayed}
					disabled={$submitting ||
						isTheSameSubject ||
						!$formData.sourceSubjectId ||
						!$formData.targetSubjectId}
				>
					Create relationship
				</Form.FormButton>
			</div>
		</form>
	</DialogButton>
</div>

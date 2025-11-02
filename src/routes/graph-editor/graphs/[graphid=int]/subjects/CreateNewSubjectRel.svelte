<script lang="ts">
	import DialogButton from '$lib/components/DialogButton.svelte';
	import * as Field from '$lib/components/ui/field/index.js';
	import type { Graph, Subject } from '@prisma/client';
	import { toast } from 'svelte-sonner';
	import { getGraph } from '../../graph.remote';
	import SubjectRelField from './SubjectRelField.svelte';
	import { createSubjectRel } from './subjects.remote';

	type Props = {
		graph: Graph & { subjects: Subject[] };
	};

	const { graph }: Props = $props();

	let dialogOpen = $state(false);
	let formRef = $state<HTMLFormElement>();

	const isTheSameSubject = $derived(
		createSubjectRel.fields.sourceSubjectId.value() ==
			createSubjectRel.fields.targetSubjectId.value() &&
			createSubjectRel.fields.sourceSubjectId.value() !== 0
	);
</script>

<div class="sticky top-2 z-10 mt-12 flex justify-between">
	<h2 class="prose m-0 flex items-center font-bold">Subject Relationships</h2>

	<DialogButton
		bind:open={dialogOpen}
		icon="plus"
		button="New Relationship"
		title="Create Relationship"
		description="Relationships connect subjects to each other."
	>
		<form
			{...createSubjectRel.enhance(async ({ form, submit }) => {
				try {
					await submit().updates(getGraph(graph.id));
					if (createSubjectRel.fields.allIssues()?.length) return;

					form.reset();
					dialogOpen = false;
					toast.success('Subjects linked successfully!');
				} catch (e) {
					toast.error(JSON.stringify(e));
				}
			})}
			oninput={() => createSubjectRel.validate()}
			bind:this={formRef}
		>
			<input hidden {...createSubjectRel.fields.graphId.as('number')} value={graph.id} />

			<SubjectRelField id="sourceSubjectId" subjects={graph.subjects} />
			<SubjectRelField id="targetSubjectId" subjects={graph.subjects} />

			<Field.Error
				>{createSubjectRel.fields
					.allIssues()
					?.map((issue) => issue.message)
					.join(', ')}</Field.Error
			>

			<Field.Submit
				form={createSubjectRel}
				oncancel={() => {
					dialogOpen = false;
					formRef?.reset();
				}}
				disabled={isTheSameSubject ||
					!createSubjectRel.fields.sourceSubjectId.value() ||
					!createSubjectRel.fields.targetSubjectId.value()}
				submitTitle="Create Subject relationship"
				loadingTitle="Creating relationship..."
			/>
		</form>
	</DialogButton>
</div>

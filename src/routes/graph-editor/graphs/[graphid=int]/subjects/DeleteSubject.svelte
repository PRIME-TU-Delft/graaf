<script lang="ts">
	import { page } from '$app/state';
	import * as Form from '$lib/components/ui/form/index.js';
	import type { PrismaGraphPayload, PrismaSubjectPayload } from '$lib/validators/types';
	import { deleteSubjectSchema } from '$lib/zod/subjectSchema';
	import { toast } from 'svelte-sonner';
	import { fromStore } from 'svelte/store';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import type { PageData } from './$types';

	type Props = {
		subject: PrismaSubjectPayload;
		graph: PrismaGraphPayload;
	};

	let { subject, graph }: Props = $props();

	const relationCount = $derived(subject.sourceSubjects.length + subject.targetSubjects.length);

	const form = superForm((page.data as PageData).deleteSubjectForm, {
		id: 'delete-subject-form-' + subject.id,
		validators: zodClient(deleteSubjectSchema),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('Domain successfully deleted!');
			}
		}
	});

	const { form: formData, enhance, submitting, delayed } = form;

	$effect(() => {
		// When the subject changes, update the form data
		if (subject) {
			$formData.graphId = graph.id;
			$formData.subjectId = subject.id;
			$formData.sourceSubjects = subject.sourceSubjects.map((d) => d.id);
			$formData.targetSubjects = subject.targetSubjects.map((d) => d.id);
		}
	});

	$effect(() => {
		// When there is an unexpected error, show a toast
		const deleteErrors = fromStore(form.allErrors).current;

		if (deleteErrors.length > 0) {
			toast.error('Could not delete domain', {
				description: 'Someone else has updated the graph since you loaded the page.',
				action: { label: 'Reload graph', onClick: () => location.reload() },
				duration: 5000
			});
		}
	});
</script>

<!-- @component
@name DeleteSubject
@description Allows the user to delete a domain. Is used in ChangeSubject.svelte
@props { domain: SubjectType, graph: GraphType }
 -->

<form class="text-xs" action="?/delete-subject" method="POST" use:enhance>
	<input type="hidden" name="graphId" value={$formData.graphId} />
	<input type="hidden" name="subjectId" value={$formData.subjectId} />

	{@render formArray('sourceSubjects')}
	{@render formArray('targetSubjects')}

	<p class="pt-1 pl-1 font-bold">Are you sure?</p>

	{#if relationCount > 0}
		<p class="max-w-64 p-1">
			This will also delete {relationCount} subject relationship{relationCount != 1 ? 's' : ''}
		</p>
	{:else}
		<p class="max-w-64 p-1">
			This subject is not part of any subject relationship, so it can be safely deleted.
		</p>
	{/if}

	<Form.FormButton
		class="mt-1 w-full"
		variant="destructive"
		disabled={$submitting}
		loading={$delayed}
		loadingMessage="Deleting..."
	>
		Yes, delete subject
	</Form.FormButton>
</form>

{#snippet formArray(name: 'sourceSubjects' | 'targetSubjects')}
	<Form.Fieldset {form} {name} class="h-0">
		{#each $formData[name], i}
			<Form.ElementField {form} name="{name}[{i}]">
				<Form.Control>
					{#snippet children({ props })}
						<input hidden type="number" bind:value={$formData[name][i]} {...props} />
					{/snippet}
				</Form.Control>
			</Form.ElementField>
		{/each}
	</Form.Fieldset>
{/snippet}

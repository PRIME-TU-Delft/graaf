<script lang="ts">
	import * as Field from '$lib/components/ui/field/index.js';
	import type { PrismaGraphPayload, PrismaSubjectPayload } from '$lib/validators/types';
	import { toast } from 'svelte-sonner';
	import { getGraph } from '../../graph.remote';
	import { deleteSubject } from './subjects.remote';

	type Props = {
		subject: PrismaSubjectPayload;
		graph: PrismaGraphPayload;
		oncancel: () => void;
	};

	let { subject, graph, oncancel }: Props = $props();

	const relationCount = $derived(subject.sourceSubjects.length + subject.targetSubjects.length);
</script>

<!-- @component
@name DeleteSubject
@description Allows the user to delete a domain. Is used in ChangeSubject.svelte
@props { domain: SubjectType, graph: GraphType }
 -->

<form
	class="text-xs"
	{...deleteSubject.enhance(async ({ submit }) => {
		try {
			await submit().updates(getGraph(graph.id));
			if (deleteSubject.fields.allIssues()?.length) return;

			toast.success('Subject deleted successfully!');
		} catch (e) {
			toast.error(JSON.stringify(e));
		}
	})}
>
	<input hidden {...deleteSubject.fields.graphId.as('number')} value={graph.id} />
	<input hidden {...deleteSubject.fields.subjectId.as('number')} value={subject.id} />

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

	<Field.Submit form={deleteSubject} {oncancel} submitTitle="Delete Subject" loadingTitle="" />
</form>

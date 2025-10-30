<script lang="ts">
	import * as Field from '$lib/components/ui/field/index.js';
	import type { PrismaDomainPayload, PrismaGraphPayload } from '$lib/validators/types';
	import { toast } from 'svelte-sonner';
	import { getGraph } from '../../graph.remote';
	import { deleteDomain } from './domain.remote';

	type Props = {
		domain: PrismaDomainPayload;
		graph: PrismaGraphPayload;
		oncancel: () => void;
	};

	let { domain, graph, oncancel }: Props = $props();

	const connectedSubjects = $derived(graph.subjects.filter((s) => s.domainId == domain.id));
	const relationCount = $derived(domain.sourceDomains.length + domain.targetDomains.length);
</script>

<!-- @component
@name DeleteDomain
@description Allows the user to delete a domain. Is used in ChangeDomain.svelte
@props { domain: DomainType, graph: GraphType }
 -->

<form
	class="text-sm"
	{...deleteDomain.enhance(async ({ submit }) => {
		try {
			await submit().updates(getGraph(graph.id));
			if (deleteDomain.fields.allIssues()?.length) return;

			toast.success('Domain deleted successfully!');
		} catch (e) {
			toast.error(JSON.stringify(e));
		}
	})}
>
	<input hidden {...deleteDomain.fields.graphId.as('number')} value={graph.id} />
	<input hidden {...deleteDomain.fields.domainId.as('number')} value={domain.id} />

	<p class="pt-1 pl-1 font-bold">Are you sure?</p>

	{#if relationCount > 0 || connectedSubjects.length > 0}
		{@const domainMessage = `delete ${relationCount} domain relationship${relationCount != 1 ? 's' : ''}`}
		{@const subjectMessage = `unlink this domain from ${connectedSubjects.length} subject${connectedSubjects.length != 1 ? 's' : ''}`}
		<p class="max-w-64 p-1">
			<!-- Will add either or both messages concatinatted if the set is larger than 0 -->
			This will also {[
				relationCount ? domainMessage : undefined,
				connectedSubjects.length ? subjectMessage : undefined
			]
				.filter((x) => x != undefined) // Remove values with no content
				.join(' and ')}.
		</p>
	{:else}
		<p class="max-w-64 p-1">
			This domain is not part of any domain relationship and has no subject dependencies, so it can
			be safely deleted.
		</p>
	{/if}

	<Field.Submit
		pending={deleteDomain.pending}
		{oncancel}
		submitTitle="Delete Domain"
		loadingTitle=""
	></Field.Submit>
</form>

<script lang="ts">
	import { page } from '$app/state';
	import * as Form from '$lib/components/ui/form/index.js';
	import type { DomainType, GraphType } from '$lib/validators/graphValidator';
	import { deleteDomainSchema } from '$lib/zod/domainSchema';
	import { toast } from 'svelte-sonner';
	import { fromStore } from 'svelte/store';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import type { PageData } from './$types';

	type Props = {
		domain: DomainType;
		graph: GraphType;
	};

	let { domain, graph }: Props = $props();

	const connectedSubjects = $derived(graph.subjects.filter((s) => s.domainId == domain.id));
	const relationCount = $derived(domain.sourceDomains.length + domain.targetDomains.length);

	const form = superForm((page.data as PageData).deleteDomainForm, {
		id: 'delete-domain-form-' + domain.id,
		validators: zodClient(deleteDomainSchema),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('Domain successfully deleted!');
			}
		}
	});

	const { form: formData, enhance, submitting, delayed } = form;

	$effect(() => {
		// When the domain changes, update the form data
		if (domain) {
			$formData.domainId = domain.id;
			$formData.sourceDomains = domain.sourceDomains.map((d) => d.id);
			$formData.targetDomains = domain.targetDomains.map((d) => d.id);
			$formData.connectedSubjects = connectedSubjects.map((s) => s.id);
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
@name DeleteDomain
@description Allows the user to delete a domain. Is used in ChangeDomain.svelte
@props { domain: DomainType, graph: GraphType }
 -->

<form class="text-sm" action="?/delete-domain" method="POST" use:enhance>
	<input type="hidden" name="domainId" value={$formData.domainId} />

	{@render formArray('sourceDomains')}
	{@render formArray('targetDomains')}
	{@render formArray('connectedSubjects')}

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

	<Form.FormButton
		class="mt-1 w-full"
		variant="destructive"
		disabled={$submitting}
		loading={$delayed}
		loadingMessage="Deleting..."
	>
		Yes, delete domain
	</Form.FormButton>
</form>

{#snippet formArray(name: 'sourceDomains' | 'targetDomains' | 'connectedSubjects')}
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

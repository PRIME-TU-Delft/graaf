<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import DialogButton from '$lib/components/DialogButton.svelte';
	import * as Form from '$lib/components/ui/form';
	import type { Domain, Graph } from '@prisma/client';
	import { toast } from 'svelte-sonner';
	import ChangeDomainRel from './ChangeDomainRel.svelte';

	const {
		domain,
		outDomain,
		graph
	}: {
		domain: Domain;
		outDomain: Domain;
		graph: Graph & { domains: Domain[] };
	} = $props();

	let dialogOpen = $state(false);

	$effect(() => {
		if (page.form?.errorMessage) toast.error(page.form.errorMessage);
	});
</script>

<DialogButton
	button=""
	title="Domain Relationship Settings"
	description="Edit the settings of the relationship between {domain.name} and {outDomain.name}."
	icon="ellipsis"
	bind:open={dialogOpen}
	variant="outline"
>
	<ChangeDomainRel {graph} {domain} {outDomain} />

	<form action="?/delete-domain-rel" method="POST" use:enhance onsubmit={console.log}>
		<input type="hidden" name="domainInId" value={domain.id} />
		<input type="hidden" name="domainOutId" value={outDomain.id} />

		<Form.Button variant="destructive" type="submit">Delete relationship</Form.Button>
	</form>
</DialogButton>

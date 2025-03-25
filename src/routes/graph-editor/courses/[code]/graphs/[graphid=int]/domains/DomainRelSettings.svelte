<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import DialogButton from '$lib/components/DialogButton.svelte';
	import * as Form from '$lib/components/ui/form';
	import type { GraphType } from '$lib/validators/OLDgraphValidator';
	import type { Domain } from '@prisma/client';
	import { toast } from 'svelte-sonner';
	import ChangeDomainRel from './ChangeDomainRel.svelte';

	const {
		domain,
		outDomain,
		graph
	}: {
		domain: Domain;
		outDomain: Domain;
		graph: GraphType;
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

	<form action="?/delete-domain-rel" method="POST" use:enhance>
		<input type="hidden" name="sourceDomainId" value={domain.id} />
		<input type="hidden" name="targetDomainId" value={outDomain.id} />

		<Form.Button variant="destructive" type="submit">Delete relationship</Form.Button>
	</form>
</DialogButton>

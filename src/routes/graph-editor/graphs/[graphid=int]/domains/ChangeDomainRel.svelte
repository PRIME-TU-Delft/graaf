<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Spinner } from '$lib/components/ui/spinner';
	import type { PrismaGraphPayload } from '$lib/validators/types';
	import { Replace } from '@lucide/svelte';
	import type { Domain } from '@prisma/client';
	import { toast } from 'svelte-sonner';
	import { getGraph } from '../../graph.remote';
	import { changeDomainRel } from './domain.remote';

	type Props = {
		graph: PrismaGraphPayload;
		domain: Domain;
		sourceDomain: Domain;
		targetDomain: Domain;
		type: 'sourceDomain' | 'targetDomain';
		onclose: () => void;
	};

	const { graph, domain, sourceDomain, targetDomain, type, onclose }: Props = $props();

	let changeRel = changeDomainRel.for(domain.id);
</script>

<form
	class="w-full"
	{...changeRel.enhance(async ({ form, submit }) => {
		try {
			await submit().updates(getGraph(graph.id));
			if (changeRel.fields.allIssues()?.length) return;

			form.reset();
			onclose();
			toast.success('Domain created successfully!');
		} catch (_) {
			console.log(_);
			toast.error('Error changing domain relationship', {
				description: 'The relationship probably already exists. Try refreshing the page.'
			});
		}
	})}
>
	<input hidden {...changeRel.fields.graphId.as('number')} value={graph.id} />

	<input hidden {...changeRel.fields.oldSourceDomainId.as('number')} value={sourceDomain.id} />
	<input hidden {...changeRel.fields.oldTargetDomainId.as('number')} value={targetDomain.id} />

	<input
		hidden
		{...changeRel.fields.targetDomainId.as('number')}
		value={type == 'targetDomain' ? domain.id : targetDomain.id}
	/>
	<input
		hidden
		{...changeRel.fields.sourceDomainId.as('number')}
		value={type == 'sourceDomain' ? domain.id : sourceDomain.id}
	/>

	<Button type="submit" disabled={!!changeRel.pending} variant="ghost" class="w-full text-start">
		{#if changeRel.pending}
			<Spinner />
			Changing to {domain.name} relationship...
		{:else}
			<Replace />
			{domain.name}
		{/if}
	</Button>
</form>

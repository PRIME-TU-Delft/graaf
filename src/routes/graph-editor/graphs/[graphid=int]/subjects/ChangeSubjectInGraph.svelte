<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Spinner } from '$lib/components/ui/spinner';
	import type { PrismaGraphPayload } from '$lib/validators/types';
	import { Replace } from '@lucide/svelte';
	import type { Domain } from '@prisma/client';
	import { toast } from 'svelte-sonner';
	import { getGraph } from '../../graph.remote';
	import { changeSubject } from './subjects.remote';

	type Props = {
		subject: PrismaGraphPayload['subjects'][0];
		graph: PrismaGraphPayload;
		domain?: Domain;
		onSuccess?: () => void;
	};

	let { subject, graph, domain, onSuccess }: Props = $props();

	let changeRel = changeSubject.for(domain?.id ?? 0);
</script>

<form
	{...changeRel.enhance(async ({ form, submit }) => {
		try {
			await submit().updates(getGraph(graph.id));
			if (changeRel.fields.allIssues()?.length) return;

			form.reset();
			onSuccess?.();
			toast.success('Subject changed successfully!');
		} catch (e) {
			toast.error(JSON.stringify(e));
		}
	})}
>
	<input hidden {...changeRel.fields.graphId.as('number')} value={graph.id} />
	<input hidden {...changeRel.fields.subjectId.as('number')} value={subject.id} />
	<input hidden {...changeRel.fields.name.as('text')} value={subject.name} />
	<input hidden {...changeRel.fields.domainId.as('number')} value={domain?.id ?? 0} />

	<Button type="submit" disabled={!!changeRel.pending} variant="ghost" class="w-full justify-start">
		{#if changeRel.pending}
			<Spinner />
			Changing to {subject.name} relationship...
		{:else}
			<Replace />
			{domain?.name ?? 'Unlink Domain'}
		{/if}
	</Button>
</form>

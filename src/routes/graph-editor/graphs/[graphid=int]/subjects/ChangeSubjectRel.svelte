<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Spinner } from '$lib/components/ui/spinner';
	import type { PrismaGraphPayload } from '$lib/validators/types';
	import { Replace } from '@lucide/svelte';
	import type { Subject } from '@prisma/client';
	import { toast } from 'svelte-sonner';
	import { getGraph } from '../../graph.remote';
	import { changeSubjectRel } from './subjects.remote';

	type Props = {
		graph: PrismaGraphPayload;
		subject: Subject;
		sourceSubject: Subject;
		targetSubject: Subject;
		type: 'sourceSubject' | 'targetSubject';
		onclose: () => void;
	};

	const { graph, subject, sourceSubject, targetSubject, type, onclose }: Props = $props();

	let changeRel = changeSubjectRel.for(subject.id);
</script>

<form
	class="w-full"
	{...changeRel.enhance(async ({ form, submit }) => {
		try {
			await submit().updates(getGraph(graph.id));
			if (changeRel.fields.allIssues()?.length) return;

			form.reset();
			onclose();
			toast.success('Subject changed successfully!');
		} catch (_) {
			console.log(_);
			toast.error('Error changing subject relationship', {
				description: 'The relationship probably already exists. Try refreshing the page.'
			});
		}
	})}
>
	<input hidden {...changeRel.fields.graphId.as('number')} value={graph.id} />

	<input hidden {...changeRel.fields.oldSourceSubjectId.as('number')} value={sourceSubject.id} />
	<input hidden {...changeRel.fields.oldTargetSubjectId.as('number')} value={targetSubject.id} />

	<input
		hidden
		{...changeRel.fields.targetSubjectId.as('number')}
		value={type == 'targetSubject' ? subject.id : targetSubject.id}
	/>
	<input
		hidden
		{...changeRel.fields.sourceSubjectId.as('number')}
		value={type == 'sourceSubject' ? subject.id : sourceSubject.id}
	/>

	<Button type="submit" disabled={!!changeRel.pending} variant="ghost" class="w-full justify-start">
		{#if changeRel.pending}
			<Spinner />
			Changing to {subject.name} relationship...
		{:else}
			<Replace />
			{subject.name}
		{/if}
	</Button>
</form>

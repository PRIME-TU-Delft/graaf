<script lang="ts">
	import { page } from '$app/state';
	import type { GraphType } from '$lib/validators/graphValidator';
	import { Check, Replace } from '@lucide/svelte';
	import type { Domain } from '@prisma/client';
	import { useId } from 'bits-ui';
	import { toast } from 'svelte-sonner';
	import { fromStore } from 'svelte/store';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import type { PageData } from './$types';
	import { subjectSchema } from '$lib/zod/subjectSchema';
	import * as Form from '$lib/components/ui/form/index.js';

	type Props = {
		subject: PageData['course']['graphs'][0]['subjects'][0];
		graph: GraphType;
		domain?: Domain;
		onSuccess?: () => void;
	};

	let { subject, graph, domain, onSuccess }: Props = $props();

	const form = superForm((page.data as PageData).newSubjectForm, {
		id: 'change-domain-form-1-' + useId() + (domain?.id ?? 'none'),
		validators: zodClient(subjectSchema),
		onResult: ({ result }) => {
			// Guard for not success
			if (result.type != 'success') {
				toast.error('Error changing subject');
				return;
			}

			onSuccess?.();
			toast.success('Subject changed successfully!');
		}
	});

	const { form: formData, enhance, submitting, delayed } = form;

	$effect(() => {
		if (subject) {
			$formData.graphId = graph.id;
			$formData.subjectId = subject.id;
			$formData.name = subject.name;
			$formData.domainId = domain?.id ?? 0;
		}
	});
</script>

<form action="?/change-subject-in-graph" method="POST" use:enhance>
	<input type="hidden" name="graphId" value={graph.id} />
	<input type="hidden" name="subjectId" value={subject.id} />
	<input type="hidden" name="name" value={subject.name} />
	<input type="hidden" name="domainId" value={domain?.id ?? 0} />

	<Form.Button
		class="w-full justify-start"
		variant="ghost"
		disabled={domain?.id === subject.domain?.id || fromStore(submitting).current}
		loading={fromStore(delayed).current}
	>
		<Replace />
		{domain?.name ?? 'None'}

		{#if domain?.id === subject.domain?.id}
			<Check class="ml-auto" />
		{/if}
	</Form.Button>
</form>

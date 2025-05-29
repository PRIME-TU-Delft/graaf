<script lang="ts">
	import { page } from '$app/state';
	import * as Form from '$lib/components/ui/form/index.js';
	import { changeSubjectRelSchema } from '$lib/zod/subjectSchema';
	import { Replace } from '@lucide/svelte';
	import type { Subject } from '@prisma/client';
	import { useId } from 'bits-ui';
	import { toast } from 'svelte-sonner';
	import { fromStore } from 'svelte/store';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import type { PageData } from './$types';
	import type { PrismaGraphPayload } from '$lib/validators/types';

	type Props = {
		graph: PrismaGraphPayload;
		subject: Subject;
		sourceSubject: Subject;
		targetSubject: Subject;
		type: 'sourceSubject' | 'targetSubject';
	};

	const { graph, subject, sourceSubject, targetSubject, type }: Props = $props();

	const form = superForm((page.data as PageData).changeSubjectRelForm, {
		id: `change-${type}-rel-form-${useId()}`,
		validators: zodClient(changeSubjectRelSchema),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('Successfully changed relationship!');
			} else if (result.type == 'error') {
				toast.error('Error changing subject relationship', {
					description: 'The relationship probably already exists. Try refreshing the page.'
				});
			}
		}
	});

	const { form: formData, enhance, submitting, delayed } = form;

	$effect(() => {
		formData.set({
			graphId: graph.id,
			sourceSubjectId: type == 'sourceSubject' ? subject.id : sourceSubject.id,
			targetSubjectId: type == 'targetSubject' ? subject.id : targetSubject.id,
			oldSourceSubjectId: sourceSubject.id,
			oldTargetSubjectId: targetSubject.id
		});
	});
</script>

<form class="w-full" action="?/change-subject-rel" method="POST" use:enhance>
	<input type="hidden" name="graphId" value={graph.id} />
	<input type="hidden" name="oldSourceSubjectId" value={sourceSubject.id} />
	<input type="hidden" name="oldTargetSubjectId" value={targetSubject.id} />
	<input
		type="hidden"
		name="sourceSubjectId"
		value={type == 'sourceSubject' ? subject.id : sourceSubject.id}
	/>
	<input
		type="hidden"
		name="targetSubjectId"
		value={type == 'targetSubject' ? subject.id : targetSubject.id}
	/>
	<Form.FormButton
		class="w-full justify-start"
		variant="ghost"
		disabled={fromStore(submitting).current}
		loading={fromStore(delayed).current}
		loadingMessage="Changing to {subject.name} relationship..."
	>
		<Replace />
		{subject.name}
	</Form.FormButton>
</form>

<script lang="ts">
	import { page } from '$app/state';
	import * as Form from '$lib/components/ui/form/index.js';
	import { type GraphType } from '$lib/validators/graphValidator';
	import { changeSubjectRelSchema, subjectRelSchema } from '$lib/zod/subjectSchema';
	import { Replace } from '@lucide/svelte';
	import type { Subject } from '@prisma/client';
	import { useId } from 'bits-ui';
	import { toast } from 'svelte-sonner';
	import { fromStore } from 'svelte/store';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import type { Infer, SuperFormData } from 'sveltekit-superforms/client';
	import type { PageData } from './$types';

	type Props = {
		graph: GraphType;
		inSubject: Subject;
		outSubject: Subject;
		type: 'subject' | 'outSubject';
	};

	const { graph, inSubject, outSubject, type }: Props = $props();

	function formGenerator(id: string) {
		return superForm((page.data as PageData).changeSubjectRelForm, {
			id: type + 'changeSubjectRelForm' + useId() + id,
			validators: zodClient(changeSubjectRelSchema),
			onResult: ({ result }) => {
				if (result.type == 'success') {
					toast.success('Successfully changed relationship!');
				} else if (result.type == 'error') {
					toast.error('Error changing subject relationship', {
						description: 'The relationship probably already exists. Try reflshing the page.'
					});
				}
			}
		});
	}

	function setFormData(
		_: HTMLFormElement,
		{
			subject,
			formData
		}: {
			subject: Subject;
			formData: SuperFormData<Infer<typeof changeSubjectRelSchema>>;
		}
	) {
		formData.set({
			graphId: graph.id,
			sourceSubjectId: type == 'subject' ? subject.id : inSubject.id,
			targetSubjectId: type == 'outSubject' ? subject.id : outSubject.id,
			oldSourceSubjectId: inSubject.id,
			oldTargetSubjectId: outSubject.id
		});
	}
</script>

{#each graph.subjects as subject (subject.id)}
	{#if subject.id != inSubject.id && subject.id != outSubject.id}
		{@const form = formGenerator(subject.id.toString())}
		{@const { form: formData, enhance, submitting, delayed } = form}

		<form
			action="?/change-subject-rel"
			method="POST"
			use:setFormData={{ subject, formData }}
			use:enhance
		>
			<input type="hidden" name="graphId" value={graph.id} />
			<input type="hidden" name="oldSourceSubjectId" value={inSubject.id} />
			<input type="hidden" name="oldTargetSubjectId" value={outSubject.id} />
			<input
				type="hidden"
				name="sourceSubjectId"
				value={type == 'subject' ? subject.id : inSubject.id}
			/>
			<input
				type="hidden"
				name="targetSubjectId"
				value={type == 'outSubject' ? subject.id : outSubject.id}
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
	{/if}
{/each}

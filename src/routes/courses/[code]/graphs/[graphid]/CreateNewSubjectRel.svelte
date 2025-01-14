<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Popover from '$lib/components/ui/popover';
	import { cn } from '$lib/utils';
	import type { Graph, Subject } from '@prisma/client';
	import { useId } from 'bits-ui';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import Plus from 'lucide-svelte/icons/plus';
	import { toast } from 'svelte-sonner';
	import { superForm, type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import SubjectRelField from './SubjectRelField.svelte';
	import { subjectRelSchema } from '$lib/zod/domainSubjectSchema';

	type Props = {
		form: SuperValidated<Infer<typeof subjectRelSchema>>;
		graph: Graph & { subjects: Subject[] };
	};

	const { form: graphForm, graph }: Props = $props();

	const subjects = $derived(graph.subjects);

	let popupOpen = $state(false);

	const form = superForm(graphForm, {
		id: 'subjectRelForm' + useId(),
		validators: zodClient(subjectRelSchema),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('Subject created successfully!');
				popupOpen = false;
			}
		}
	});

	const { form: formData, enhance } = form;

	const isTheSameSubject = $derived(
		$formData.subjectInId == $formData.subjectOutId && $formData.subjectInId != 0
	);
</script>

<Popover.Root bind:open={popupOpen}>
	<Popover.Trigger class={cn(buttonVariants({ variant: 'default' }))}>
		<Plus /> Create Relationship
	</Popover.Trigger>
	<Popover.Content>
		<form action="?/add-subject-rel" method="POST" use:enhance>
			<p class="text-lg font-bold">Create Relationship</p>

			<input type="hidden" name="graphId" value={graph.id} />

			<SubjectRelField id="subjectInId" {subjects} {form} {formData} />
			<SubjectRelField id="subjectOutId" {subjects} {form} {formData} />

			<Form.FormError {form} />

			<div class="flex justify-between gap-1">
				{@render relVisualizer()}
				<Form.FormButton
					disabled={isTheSameSubject || !$formData.subjectInId || !$formData.subjectOutId}
				>
					Submit
				</Form.FormButton>
			</div>
		</form>
	</Popover.Content>
</Popover.Root>

{#snippet relVisualizer()}
	<div class="flex items-center gap-1">
		<div
			class={cn('rounded-full border-2 border-slate-500 px-2 py-1 text-xs', {
				'border-red-500': isTheSameSubject
			})}
			class:opacity-50={$formData.subjectInId == 0}
		>
			{$formData.subjectInId || 'select in'}
		</div>
		<ArrowRight class="size-4" />
		<div
			class={cn('rounded-full border-2 border-slate-500 px-2 py-1 text-xs', {
				'border-red-500': isTheSameSubject
			})}
			class:opacity-50={$formData.subjectOutId == 0}
		>
			{$formData.subjectOutId || 'select out'}
		</div>
		{#if isTheSameSubject}
			<p class="ml-1 text-xs text-red-500">Subjects can't be the same.</p>
		{/if}
	</div>
{/snippet}

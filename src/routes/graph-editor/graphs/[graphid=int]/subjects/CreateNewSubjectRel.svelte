<script lang="ts">
	import { page } from '$app/state';
	import { buttonVariants } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Popover from '$lib/components/ui/popover';
	import { cn } from '$lib/utils';
	import { subjectRelSchema } from '$lib/zod/subjectSchema';
	import type { Graph, Subject } from '@prisma/client';
	import { useId } from 'bits-ui';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import Plus from 'lucide-svelte/icons/plus';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import type { PageData } from './$types';
	import SubjectRelField from './SubjectRelField.svelte';
	import { dev } from '$app/environment';

	type Props = {
		graph: Graph & { subjects: Subject[] };
	};

	const { graph }: Props = $props();

	let popupOpen = $state(false);

	const form = superForm((page.data as PageData).newSubjectRelForm, {
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
		$formData.sourceSubjectId == $formData.targetSubjectId && $formData.sourceSubjectId != 0
	);
</script>

<div class="sticky top-2 z-10 mt-12 flex justify-between">
	<h2 class="m-0">Relationships</h2>
	<Popover.Root bind:open={popupOpen}>
		<Popover.Trigger class={cn(buttonVariants({ variant: 'default' }))}>
			<Plus /> Create Relationship
		</Popover.Trigger>
		<Popover.Content>
			<form action="?/add-subject-rel" method="POST" use:enhance>
				<p class="text-lg font-bold">Create Relationship</p>

				<input type="hidden" name="graphId" value={graph.id} />

				<SubjectRelField id="sourceSubjectId" subjects={graph.subjects} {form} {formData} />
				<SubjectRelField id="targetSubjectId" subjects={graph.subjects} {form} {formData} />

				<Form.FormError {form} />

				<div class="flex justify-between gap-1">
					{#if dev}
						{@render relVisualizer()}
					{/if}
					<Form.FormButton
						disabled={isTheSameSubject || !$formData.sourceSubjectId || !$formData.targetSubjectId}
					>
						Submit
					</Form.FormButton>
				</div>
			</form>
		</Popover.Content>
	</Popover.Root>
</div>

{#snippet relVisualizer()}
	<div class="flex items-center gap-1">
		<div
			class={cn('rounded-full border-2 border-slate-500 px-2 py-1 text-xs', {
				'border-red-500': isTheSameSubject
			})}
			class:opacity-50={$formData.sourceSubjectId == 0}
		>
			{$formData.sourceSubjectId || 'select in'}
		</div>
		<ArrowRight class="size-4" />
		<div
			class={cn('rounded-full border-2 border-slate-500 px-2 py-1 text-xs', {
				'border-red-500': isTheSameSubject
			})}
			class:opacity-50={$formData.targetSubjectId == 0}
		>
			{$formData.targetSubjectId || 'select out'}
		</div>
		{#if isTheSameSubject}
			<p class="ml-1 text-xs text-red-500">Subjects can't be the same.</p>
		{/if}
	</div>
{/snippet}

<script lang="ts">
	import { page } from '$app/state';
	import DialogButton from '$lib/components/DialogButton.svelte';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input';
	import { lectureSchema } from '$lib/zod/lectureSchema';
	import type { Graph, Lecture } from '@prisma/client';
	import { useId } from 'bits-ui';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import type { PageData } from './$types';
	import * as Popover from '$lib/components/ui/popover';
	import { cn } from '$lib/utils';
	import { buttonVariants } from '$lib/components/ui/button';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Undo2 } from '@lucide/svelte';
	import DeleteLecture from './DeleteLecture.svelte';

	type Props = {
		lecture: Lecture;
		graph: Graph;
		onSuccess: () => void;
	};

	const { lecture, graph, onSuccess }: Props = $props();

	let changeLectureDialog = $state(false);

	const form = superForm((page.data as PageData).newLectureForm, {
		id: 'change-lecture-form-' + useId(),
		validators: zodClient(lectureSchema),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('lectures successfully (un-)linked!');
				changeLectureDialog = false;
				onSuccess();
			}
		}
	});

	const { form: formData, enhance, submitting, delayed, tainted, isTainted } = form;

	$effect(() => {
		if (lecture) {
			$formData.lectureId = lecture.id;
			$formData.name = lecture.name;
			$formData.graphId = graph.id;
		}
	});
</script>

<DialogButton
	button="Edit"
	title="Lecture Settings"
	description="Edit the settings of the lecture {lecture.name}."
	bind:open={changeLectureDialog}
	variant="outline"
	class="h-auto w-full justify-start rounded-sm border-0 px-2 py-1.5 hover:shadow-none"
>
	<form action="?/change-lecture-name" method="POST" use:enhance>
		<input type="hidden" name="lectureId" value={lecture.id} />
		<input type="hidden" name="graphId" value={graph.id} />

		<Form.Field {form} name="name" class="grow">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Name</Form.Label>
					<Input {...props} bind:value={$formData.name} />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors class="mb-2" />
		</Form.Field>

		<div class="mt-4 flex w-full justify-end gap-1">
			<Popover.Root>
				<Popover.Trigger class={cn(buttonVariants({ variant: 'destructive' }))}>
					Delete subject
				</Popover.Trigger>
				<Popover.Content>
					<DeleteLecture {lecture} {graph} onSuccess={() => {}} />
				</Popover.Content>
			</Popover.Root>

			<Button
				variant="outline"
				disabled={!isTainted($tainted)}
				onclick={() => {
					$formData.name = lecture.name;
					tainted.set({ name: false, graphId: false });
				}}
			>
				<Undo2 /> Reset
			</Button>

			<Form.FormButton
				disabled={$submitting || !isTainted($tainted)}
				loading={$delayed}
				loadingMessage="Saving..."
			>
				Save
			</Form.FormButton>
		</div>
	</form>
</DialogButton>

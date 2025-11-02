<script lang="ts">
	import DialogButton from '$lib/components/DialogButton.svelte';
	import { buttonVariants } from '$lib/components/ui/button';
	import * as Field from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input';
	import * as Popover from '$lib/components/ui/popover';
	import { cn } from '$lib/utils';
	import { fieldToIssueString } from '$lib/utils/issues';
	import type { Graph, Lecture } from '@prisma/client';
	import { toast } from 'svelte-sonner';
	import { getGraph } from '../../graph.remote';
	import DeleteLecture from './DeleteLecture.svelte';
	import { changeLectureName } from './lecture.remote';

	type Props = {
		lecture: Lecture;
		graph: Graph;
		onSuccess: () => void;
	};

	const { lecture, graph, onSuccess }: Props = $props();

	let changeLectureDialog = $state(false);
	let formRef = $state<HTMLFormElement>();
</script>

<DialogButton
	button="Edit name"
	title="Lecture Settings"
	description="Edit the settings of the lecture {lecture.name}."
	bind:open={changeLectureDialog}
	variant="outline"
	class="h-auto w-full justify-start rounded-sm border-0 px-2 py-1.5 hover:shadow-none"
>
	<form
		{...changeLectureName.enhance(async ({ form, submit }) => {
			try {
				await submit().updates(getGraph(graph.id));
				if (changeLectureName.fields.allIssues()?.length) return;

				form.reset();
				changeLectureDialog = false;
				onSuccess();
				toast.success('Lecture changed successfully!');
			} catch (e) {
				toast.error(JSON.stringify(e));
			}
		})}
		bind:this={formRef}
	>
		<input hidden {...changeLectureName.fields.graphId.as('number')} value={graph.id} />
		<input hidden {...changeLectureName.fields.lectureId.as('number')} value={lecture.id} />

		<Field.Field>
			<Field.Label for="name">Domain name</Field.Label>
			<Input {...changeLectureName.fields.name.as('text')} value={lecture.name} />
			<Field.Error>{fieldToIssueString(changeLectureName.fields.name)}</Field.Error>
		</Field.Field>

		<Field.Submit
			form={changeLectureName}
			oncancel={() => {
				formRef?.reset();
				changeLectureDialog = false;
				onSuccess();
			}}
			submitTitle="Change Lecture"
			loadingTitle="Changing Lecture..."
		>
			{#snippet before()}
				<Popover.Root>
					<Popover.Trigger class={cn(buttonVariants({ variant: 'destructive' }))}>
						Delete lecture
					</Popover.Trigger>
					<Popover.Content>
						<DeleteLecture {lecture} {graph} {onSuccess} />
					</Popover.Content>
				</Popover.Root>
			{/snippet}
		</Field.Submit>
	</form>
</DialogButton>

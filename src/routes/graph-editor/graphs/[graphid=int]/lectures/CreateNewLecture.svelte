<script lang="ts">
	import DialogButton from '$lib/components/DialogButton.svelte';
	import * as Field from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input';
	import { fieldToIssueString } from '$lib/utils/issues';
	import type { Graph } from '@prisma/client';
	import { toast } from 'svelte-sonner';
	import { getGraph } from '../../graph.remote';
	import { createLecture } from './lecture.remote';

	type Props = {
		graph: Graph;
	};

	const { graph }: Props = $props();

	let dialogOpen = $state(false);
	let formRef = $state<HTMLFormElement>();
</script>

<DialogButton
	bind:open={dialogOpen}
	icon="plus"
	button="New Lecture"
	title="Create Lecture"
	description="A lecture stores multiple subjects"
	class="sticky top-2 z-10 float-right -mt-14 h-9"
>
	<!-- For sumbitting a NEW PROGRAM
 	It triggers an action that can be seen in +page.server.ts -->
	<form
		{...createLecture.enhance(async ({ form, submit }) => {
			try {
				await submit().updates(getGraph(graph.id));
				console.log(createLecture.fields.allIssues());
				if (createLecture.fields.allIssues()?.length) return;

				form.reset();
				dialogOpen = false;
				toast.success('Lecture created successfully!');
			} catch (e) {
				toast.error(JSON.stringify(e));
			}
		})}
		bind:this={formRef}
	>
		<input hidden {...createLecture.fields.graphId.as('number')} value={graph.id} />

		<Field.Field>
			<Field.Label for="name">Subject name</Field.Label>
			<Input {...createLecture.fields.name.as('text')} />
			<Field.Error>{fieldToIssueString(createLecture.fields.name)}</Field.Error>
		</Field.Field>

		<Field.Submit
			form={createLecture}
			oncancel={() => {
				dialogOpen = false;
				formRef?.reset();
			}}
			submitTitle="Create Lecture"
			loadingTitle="Creating Lecture..."
		/>
	</form>
</DialogButton>

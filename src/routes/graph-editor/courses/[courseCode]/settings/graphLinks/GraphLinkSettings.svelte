<script lang="ts">
	import { page } from '$app/state';
	import { hasCoursePermissions, type CoursePermissions } from '$lib/utils/permissions';
	import { graphSchemaWithId } from '$lib/zod/graphSchema';
	import { Undo2 } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	import { Button } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input';
	import DeleteGraph from './DeleteGraph.svelte';

	import type { Course, Graph, Lecture, Link } from '@prisma/client';
	import type { PageData } from '../$types';
	import DialogButton from '$lib/components/DialogButton.svelte';

	type GraphLinksProps = {
		course: Course & CoursePermissions & { links: Link[] };
		graph: Graph & {
			lectures: Lecture[];
			links: Link[];
		};
	};

	const { course, graph }: GraphLinksProps = $props();

	const id = $props.id();
	let graphSettingsOpen = $state(false);

	const form = superForm((page.data as PageData).editGraphForm, {
		id: 'change-graph-' + id,
		validators: zodClient(graphSchemaWithId),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('Succesfully changed graph!');

				graphSettingsOpen = false;
			}
		}
	});

	const { form: formData, enhance: formEnhance, submitting, delayed } = form;

	function resetForm() {
		$formData.graphId = graph.id;
		$formData.parentId = course.id;
		$formData.parentType = 'COURSE';
		$formData.name = graph.name;
	}

	const hasChanges = $derived.by(() => {
		return $formData.name !== graph.name;
	});

	$effect(() => {
		$formData.graphId = graph.id;
		$formData.parentId = course.id;
		$formData.parentType = 'COURSE';
		$formData.name = graph.name;
	});
</script>

<DialogButton
	bind:open={graphSettingsOpen}
	onclick={(e) => {
		e.preventDefault();
		e.stopPropagation();
		graphSettingsOpen = true;
	}}
	icon="edit"
	button="Graph settings"
	title="Graph settings"
	class="grow"
>
	<form action="?/edit-graph" method="POST" use:formEnhance>
		<input type="text" name="graphId" value={graph.id} hidden />
		<input type="text" name="parentId" value={course.id} hidden />
		<input type="text" name="parentType" value="COURSE" hidden />

		<Form.Field {form} name="name">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label for="name">Course name</Form.Label>
					<Input {...props} bind:value={$formData['name']} />
				{/snippet}
			</Form.Control>
			<Form.Description />
			<Form.FieldErrors />
		</Form.Field>

		<div class="flex items-center justify-between gap-1">
			<Form.FormError class="w-full text-right" {form} />

			{#if hasCoursePermissions(page.data.user, course, 'CourseAdminORProgramAdminEditor')}
				<DeleteGraph {course} {graph} onSuccess={() => (graphSettingsOpen = false)} />
			{/if}

			<Button variant="outline" disabled={!hasChanges || $submitting} onclick={resetForm}>
				<Undo2 /> Reset
			</Button>
			<Form.FormButton disabled={!hasChanges || $submitting} loading={$delayed}>
				Change graph
			</Form.FormButton>
		</div>
	</form>
</DialogButton>

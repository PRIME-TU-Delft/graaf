<script lang="ts">
	import { page } from '$app/state';
	import { hasCoursePermissions, type CoursePermissions } from '$lib/utils/permissions';
	import { graphSchemaWithId } from '$lib/zod/graphSchema';
	import { Code, EyeOff, Undo2 } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { fade } from 'svelte/transition';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	import { Button } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input';
	import DeleteGraph from './DeleteGraph.svelte';

	import type { Course, Graph, Lecture, Link } from '@prisma/client';
	import type { PageData } from '../$types';
	import AddAliasLink from './AddAliasLink.svelte';
	import DeleteAliasLink from './DeleteAliasLink.svelte';
	import MoveAliasLink from './MoveAliasLink.svelte';

	type GraphLinksProps = {
		course: Course & CoursePermissions & { links: Link[] };
		graph: Graph & {
			lectures: Lecture[];
			links: Link[];
		};
		graphs: Graph[];
		onSuccess?: () => void;
	};

	const { course, graph, graphs, onSuccess = () => {} }: GraphLinksProps = $props();

	let links = $state(graph.links.map((link) => link));

	const id = $props.id();

	const form = superForm((page.data as PageData).editGraphForm, {
		id: 'change-graph-' + id,
		validators: zodClient(graphSchemaWithId),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('Succesfully changed graph!');

				onSuccess();
			}
		}
	});

	const { form: formData, enhance: formEnhance, submitting, delayed } = form;

	function resetForm() {
		$formData.graphId = graph.id;
		$formData.courseCode = course.code;
		$formData.name = graph.name;
	}

	const hasChanges = $derived.by(() => {
		return $formData.name !== graph.name;
	});

	$effect(() => {
		$formData.graphId = graph.id;
		$formData.courseCode = course.code;
		$formData.name = graph.name;
	});
</script>

<form action="?/edit-graph" method="POST" use:formEnhance>
	<input type="text" name="graphId" value={graph.id} hidden />
	<input type="text" name="courseCode" value={course.code} hidden />

	<div class="mb-2 rounded border p-2">
		<h3 class="text-lg font-bold">Links</h3>
		<p class="text-sm">
			A link can be used to make a graph visible to students. Each link needs a unique name within a
			course. When a link is created, it will be visible to all students. A link can be disabled by
			clicking on the
			<EyeOff class="border-sm inline size-6 rounded bg-blue-100 p-1" /> icon. This will make the link
			invisible to students, but the graph can still be accessed by its editors and admin. An embed can
			be created by clicking on the
			<Code class="border-sm inline size-6 rounded bg-blue-100 p-1" /> icon when closing this modal.
		</p>
		<div class="my-2 grid grid-cols-1 gap-x-4 gap-y-2">
			{#each links as link (link.id)}
				<div in:fade class="flex w-full items-center justify-between gap-1">
					<p class="w-full rounded border border-blue-100 bg-blue-50/50 p-2">{link.name}</p>

					{#if graphs.length > 1}
						<MoveAliasLink {course} {graph} {graphs} {link} {onSuccess} />
					{/if}

					<DeleteAliasLink {course} {graph} {link} {onSuccess} />
				</div>
			{/each}
		</div>

		<AddAliasLink
			{course}
			{graph}
			onSuccess={(link) => {
				links.push(link);
			}}
		/>
	</div>

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
			<DeleteGraph {course} {graph} {onSuccess} />
		{/if}

		<Button variant="outline" disabled={!hasChanges || $submitting} onclick={resetForm}>
			<Undo2 /> Reset
		</Button>
		<Form.FormButton disabled={!hasChanges || $submitting} loading={$delayed}>
			Change graph
		</Form.FormButton>
	</div>
</form>

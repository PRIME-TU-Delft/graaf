<script lang="ts">
	import { page } from '$app/state';
	import { hasCoursePermissions, type CoursePermissions } from '$lib/utils/permissions';
	import { graphEditSchema } from '$lib/zod/graphSchema';
	import { ChevronDown, Code, Copy, Eye, EyeClosed, Trash, Undo2 } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { fade } from 'svelte/transition';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	import DialogButton from '$lib/components/DialogButton.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input';
	import DeleteGraph from './DeleteGraph.svelte';

	import type { Course, Graph, Lecture } from '@prisma/client';
	import type { PageData } from '../$types';

	type GraphLinksProps = {
		course: Course & CoursePermissions;
		graph: Graph & {
			lectures: Lecture[];
		};
		onSuccess?: () => void;
	};

	const { course, graph, onSuccess = () => {} }: GraphLinksProps = $props();

	let isVisible = $state(graph.isVisible);
	let aliases = $state(graph.aliasLinks.map((link) => link));
	let newAlias = $state('');

	const id = $props.id();

	const form = superForm((page.data as PageData).editGraphForm, {
		id: 'change-graph-' + id,
		validators: zodClient(graphEditSchema),
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
		$formData.isVisible = graph.isVisible;
		$formData.aliases = graph.aliasLinks.map((link) => link);
	}

	const hasChanges = $derived.by(() => {
		return (
			$formData.name !== graph.name ||
			$formData.isVisible !== graph.isVisible ||
			$formData.aliases.length !== graph.aliasLinks.length ||
			$formData.aliases.some((alias, i) => alias !== graph.aliasLinks[i])
		);
	});

	$effect(() => {
		$formData.graphId = graph.id;
		$formData.courseCode = course.code;
		$formData.name = graph.name;
		$formData.isVisible = isVisible;
		$formData.aliases = aliases;
	});

	function handleAddAlias() {
		if (newAlias.length < 1) return;
		aliases = [...aliases, newAlias];
		newAlias = '';
	}
</script>

<form action="?/edit-graph" method="POST" use:formEnhance>
	<input type="text" name="graphId" value={graph.id} hidden />
	<input type="text" name="courseCode" value={course.code} hidden />

	<Form.Field {form} name="isVisible">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label
					class="flex items-center justify-between gap-2 rounded border border-blue-100 bg-blue-50 p-2"
				>
					<input type="hidden" value={$formData['isVisible']} {...props} />
					<p>{@render showVisiblity()} Graph is {isVisible ? '' : 'not'} visible to students</p>

					<div class="flex items-center gap-2">
						<Button onclick={() => (isVisible = !isVisible)}>
							{isVisible ? 'Make private' : 'Make public'}
						</Button>
					</div>
				</Form.Label>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors class="!mb-2" />
	</Form.Field>

	{#if isVisible}
		{@const mainLink = `${page.url.host}/graph/${graph.id}/${graph.name.replaceAll(' ', '_')}`}
		<div class="relative mb-2">
			<Input value={mainLink} disabled />

			<Button
				variant="outline"
				class="absolute right-1 top-1/2 size-8 -translate-y-1/2"
				onclick={() => {
					navigator.clipboard.writeText(mainLink);
					toast.success('Link copied to clipboard!');
				}}
			>
				<Copy class="size-4" />
			</Button>
		</div>

		<div class="mb-2 rounded border p-2">
			<h3 class="text-lg font-bold">Aliases</h3>
			<p class="text-sm">
				An alias is an extra link that will redirect to the main link. It is used to embed a graph
				in some other program like Brightspace. An embed can be created by clicking on the
				<Code class="inline rounded bg-blue-100 p-2" /> icon when closing this modal.
			</p>
			<div class="mb-2 grid grid-cols-1 gap-x-4 gap-y-2">
				{#each aliases as alias, i}
					<div in:fade class="flex w-full items-center justify-between gap-1">
						<p class="w-full rounded border border-blue-100 bg-blue-50/50 p-2">{alias}</p>

						<Button class="ml-auto" variant="outline">Move to other graph<ChevronDown /></Button>
						<Button
							variant="destructive"
							class="w-16 p-1"
							onclick={() => {
								aliases = aliases.filter((_, index) => index !== i);
							}}
						>
							<Trash />
						</Button>
					</div>
				{/each}
			</div>

			<div in:fade class="flex items-center gap-2">
				<Input type="text" name="alias" placeholder="Add an alias" bind:value={newAlias} />
				<Button onclick={handleAddAlias} disabled={newAlias.length < 1}>Add alias</Button>
			</div>
		</div>
	{/if}

	<Form.Fieldset {form} name="aliases" class="h-0">
		{#each $formData.aliases, i}
			<Form.ElementField {form} name="aliases[{i}]">
				<Form.Control>
					{#snippet children({ props })}
						<input type="hidden" bind:value={$formData.aliases[i]} {...props} />
					{/snippet}
				</Form.Control>
			</Form.ElementField>
		{/each}
	</Form.Fieldset>

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

{#snippet showVisiblity()}
	{#if isVisible}
		<div in:fade class="inline">
			<Eye class="border-sm inline size-6 rounded bg-blue-100 p-1" />
		</div>
	{:else}
		<div in:fade class="inline">
			<EyeClosed class="border-sm inline size-6 rounded bg-blue-100 p-1" />
		</div>
	{/if}
{/snippet}

<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import DialogButton from '$lib/components/DialogButton.svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { cn } from '$lib/utils';
	import { graphEditSchema } from '$lib/zod/graphSchema';
	import { ChevronDown, Code, Copy, Eye, EyeClosed, Undo2 } from '@lucide/svelte';
	import type { Course, Graph, Lecture, Link } from '@prisma/client';
	import { toast } from 'svelte-sonner';
	import { fade } from 'svelte/transition';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import type { PageData } from '../$types';
	import EmbedGraph from './EmbedGraph.svelte';
	import { EmbedState } from './GraphEmbedState.svelte';

	type GraphLinksProps = {
		course: Course;
		graph: Graph & { links: Link[]; lectures: Lecture[] };
	};

	const { course, graph }: GraphLinksProps = $props();
	let graphLinkSettingsOpen = $state(true);

	let isVisible = $state(graph.isVisible);
	let aliases = $state(graph.links.map((link) => link.name));
	let newAlias = $state('');

	const id = $props.id();

	const form = superForm((page.data as PageData).editGraphForm, {
		id: 'change-graph-' + id,
		validators: zodClient(graphEditSchema),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('Succesfully unlinked courses!');

				graphLinkSettingsOpen = false;
			}
		}
	});

	const { form: formData, enhance: formEnhance, submitting, delayed } = form;

	$effect(() => {
		$formData.graphId = graph.id;
		$formData.courseCode = course.code;
		$formData.isVisible = isVisible;
		$formData.aliases = aliases;
	});

	function handleAddAlias() {
		if (newAlias.length < 1) return;
		aliases = [...aliases, newAlias];
		newAlias = '';
	}

	const graphEmbedState = new EmbedState();
</script>

<DialogButton
	bind:open={graphLinkSettingsOpen}
	icon="link"
	button="Settings"
	title="Graph link settings"
>
	<form action="?/change-graph" method="POST" use:formEnhance>
		<input type="text" name="graphId" value={graph.id} hidden />
		<input type="text" name="courseCode" value={course.code} hidden />

		<Form.Field {form} name="name">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label
						class="flex items-center justify-between gap-2 rounded border border-blue-100 bg-blue-50 p-2"
					>
						<p>{@render showVisiblity()} Graph is {isVisible ? '' : 'not'} visible to students</p>

						<div class="flex items-center gap-2">
							{#if isVisible}
								<Popover.Root>
									<Popover.Trigger><Code /></Popover.Trigger>
									<Popover.Content class="w-96">
										<EmbedGraph {graph} {aliases} {course} {graphEmbedState} />
									</Popover.Content>
								</Popover.Root>
							{/if}

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
				<p class="text-sm">An alias is an extra link that will redirect to the main link.</p>
				<div class="mb-2 grid grid-cols-1 gap-x-4 gap-y-2 md:grid-cols-2">
					{#each aliases as alias, i}
						<div in:fade class="flex w-full items-center justify-between gap-1">
							<p class="w-full rounded border border-blue-100 bg-blue-50/50 p-2">{alias}</p>

							<Button class="ml-auto" variant="outline">Move <ChevronDown /></Button>
							<Button
								variant="destructive"
								class="p-1"
								onclick={() => {
									aliases = aliases.filter((_, index) => index !== i);
								}}
							>
								Remove
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

			{@render deleteGraph()}

			<Button
				variant="outline"
				disabled={$formData.name == graph.name}
				onclick={() => ($formData.name = graph.name)}
			>
				<!-- Todo: make better reset -->
				<Undo2 /> Reset
			</Button>
			<Form.FormButton disabled={$formData.name == graph.name}>Change</Form.FormButton>
		</div>
	</form>
</DialogButton>

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

{#snippet deleteGraph()}
	<Popover.Root>
		<Popover.Trigger class={cn(buttonVariants({ variant: 'destructive' }))}>
			Delete domain
		</Popover.Trigger>
		<Popover.Content>
			<form
				class="text-sm"
				action="?/delete-graph"
				method="POST"
				use:enhance={() => {
					toast.success('Graph successfully deleted!');
					graphLinkSettingsOpen = false;
				}}
			>
				<input type="hidden" name="graphId" value={graph.id} />
				<input type="hidden" name="name" value={graph.name} />
				<input type="hidden" name="courseCode" value={graph.courseId} />

				<p class="pl-1 pt-1 font-bold">Are you sure?</p>

				<Form.Button variant="destructive" class="mt-1 w-full">Yes, delete graph</Form.Button>
			</form>
		</Popover.Content>
	</Popover.Root>
{/snippet}

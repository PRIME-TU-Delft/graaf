<script lang="ts">
	import { duplicateGraphSchema } from '$lib/zod/graphSchema';
	import { closeAndFocusTrigger, cn } from '$lib/utils';
	import { toast } from 'svelte-sonner';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { fromStore } from 'svelte/store';
	import { displayName } from '$lib/utils/displayUserName';
	import { fade } from 'svelte/transition';
	import { superForm } from 'sveltekit-superforms';
	import { useId } from 'bits-ui';
	import { page } from '$app/state';

	// Components
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input';
	import * as Popover from '$lib/components/ui/popover/index.js';

	// Icons
	import Check from 'lucide-svelte/icons/check';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
	import Undo2 from 'lucide-svelte/icons/undo-2';
	import { Copy } from '@lucide/svelte';

	import type { PageData } from './$types';
	import type { Graph } from '@prisma/client';

	type DuplicateGraphProps = {
		graph: Graph;
		isDuplicateOpen?: boolean;
	};

	let { graph, isDuplicateOpen = $bindable() }: DuplicateGraphProps = $props();

	const triggerId = useId();
	const data = page.data as PageData;
	const form = superForm(data.duplicateGraphForm, {
		id: 'duplicate-graph-' + useId(),
		validators: zodClient(duplicateGraphSchema),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('Graph successfully copied!');
				isDuplicateOpen = false;
			}
		}
	});

	const { form: formData, enhance, submitting, delayed } = form;

	let isDestinationCourseOpen = $state(false);

	let destinationSandboxes = $derived(
		data.availableSandboxes.map((s) => ({
			id: s.id,
			type: 'SANDBOX',
			name: `${s.name} - ${displayName(s.owner)}`
		}))
	);

	let destinationCourses = $derived(
		data.availableCourses.map((c) => ({
			id: c.id,
			type: 'COURSE',
			name: `${c.code} ${c.name}`
		}))
	);

	let availableDestinations = $derived([...destinationCourses, ...destinationSandboxes]);

	let graphHasSameNameAsOriginal = $derived.by(() => {
		const { destinationId, destinationType, newName } = fromStore(formData).current;

		let graphsInDestination;
		if (destinationType === 'COURSE') {
			graphsInDestination = data.availableCourses.find((c) => c.id === destinationId)?.graphs;
		} else {
			graphsInDestination = data.availableSandboxes.find((s) => s.id === destinationId)?.graphs;
		}

		if (!graphsInDestination) return false;
		return graphsInDestination.some((g) => g.name === newName);
	});

	$effect(() => {
		if (graph.id) {
			$formData.newName = graph.name + ' copy';
			$formData.graphId = graph.id;
			$formData.destinationType = graph.parentType;
			$formData.destinationId = (
				graph.parentType === 'COURSE' ? graph.courseId : graph.sandboxId
			) as number;
		}
	});
</script>

<form action="?/duplicate-graph" method="POST" use:enhance>
	<input type="text" name="graphId" value={graph.id} hidden />

	<Form.Field {form} name="newName">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label for="newName">Graph name</Form.Label>
				<Input {...props} bind:value={$formData['newName']} />
			{/snippet}
		</Form.Control>
		<Form.Description />
		<Form.FieldErrors />
	</Form.Field>

	{#if graphHasSameNameAsOriginal}
		<div
			in:fade={{ duration: 200 }}
			class="mt-2 rounded border-2 border-amber-700 bg-amber-50 p-2 text-sm text-amber-700"
		>
			<h3 class="font-bold">Warning</h3>
			The destination already has a graph with the same name. This may cause confusion.
		</div>
	{/if}

	{@render selectDestination()}

	<div class="mt-2 flex items-center justify-between gap-1">
		<Form.FormError class="w-full text-right" {form} />
		<Button
			variant="outline"
			onclick={() =>
				form.reset({
					newState: {
						newName: graph.name + ' copy',
						graphId: graph.id,
						destinationType: graph.parentType,
						destinationId: (graph.parentType === 'COURSE'
							? graph.courseId
							: graph.sandboxId) as number
					}
				})}
		>
			<Undo2 /> Reset
		</Button>
		<Form.FormButton disabled={$submitting} loading={$delayed}>
			<Copy /> Duplicate
			{#snippet loadingMessage()}
				<span>Copying graph elements...</span>
			{/snippet}
		</Form.FormButton>
	</div>
</form>

{#snippet selectDestination()}
	<Form.Field {form} name="destinationId">
		<Popover.Root bind:open={isDestinationCourseOpen}>
			<Form.Control id={triggerId}>
				{#snippet children({ props })}
					<div class="mt-2 flex w-full items-center justify-between">
						<Form.Label>Destination</Form.Label>
						<Popover.Trigger
							class={cn(buttonVariants({ variant: 'outline' }), 'min-w-[50%] justify-between')}
							role="combobox"
							{...props}
						>
							{availableDestinations.find(
								(d) => d.type === $formData.destinationType && d.id === $formData.destinationId
							)?.name}
							<ChevronsUpDown class="opacity-50" />
						</Popover.Trigger>
						<input
							hidden
							value={$formData.destinationId}
							defaultValue={graph.courseId}
							name={props.name}
						/>
					</div>
				{/snippet}
			</Form.Control>
			<Popover.Content>
				<Command.Root loop>
					<Command.Input autofocus placeholder="Search destinations..." class="my-1 h-9" />
					<Command.Empty>No course found.</Command.Empty>
					<Command.Group heading="Sandboxes">
						{#each destinationSandboxes as sandbox (sandbox.id)}
							<Command.Item
								value={String(sandbox.id)}
								onSelect={() => {
									$formData.destinationId = sandbox.id;
									$formData.destinationType = 'SANDBOX';
									closeAndFocusTrigger(triggerId, () => (isDestinationCourseOpen = false));
								}}
							>
								{sandbox.name}
								<Check
									class={cn(
										'ml-auto',
										($formData.destinationType !== 'SANDBOX' ||
											$formData.destinationId !== sandbox.id) &&
											'text-transparent'
									)}
								/>
							</Command.Item>
						{/each}
					</Command.Group>

					<Command.Group heading="Courses">
						{#each destinationCourses as course (course.id)}
							<Command.Item
								value={String(course.id)}
								onSelect={() => {
									$formData.destinationId = course.id;
									$formData.destinationType = 'COURSE';
									closeAndFocusTrigger(triggerId, () => (isDestinationCourseOpen = false));
								}}
							>
								{course.name}
								<Check
									class={cn(
										'ml-auto',
										($formData.destinationType !== 'COURSE' ||
											$formData.destinationId !== course.id) &&
											'text-transparent'
									)}
								/>
							</Command.Item>
						{/each}
					</Command.Group>
				</Command.Root>
			</Popover.Content>
		</Popover.Root>
		<Form.FieldErrors />
	</Form.Field>
{/snippet}

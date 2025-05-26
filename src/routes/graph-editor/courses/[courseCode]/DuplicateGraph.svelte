<script lang="ts">
	import { page } from '$app/state';
	import { closeAndFocusTrigger, cn } from '$lib/utils';
	import { displayName } from '$lib/utils/displayUserName';
	import { duplicateGraphSchema } from '$lib/zod/graphSchema';
	import { useId } from 'bits-ui';
	import { toast } from 'svelte-sonner';
	import { fromStore } from 'svelte/store';
	import { fade } from 'svelte/transition';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	// Components
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input';
	import * as Popover from '$lib/components/ui/popover/index.js';
	// Icons
	import { Copy } from '@lucide/svelte';
	import Check from 'lucide-svelte/icons/check';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
	import Undo2 from 'lucide-svelte/icons/undo-2';

	import type { PageData } from './$types';	
	import type { Prisma, Graph } from '@prisma/client';

	type DuplicateGraphProps = {
		graph: Graph;
		availableCourses: Prisma.CourseGetPayload<{
			include: {
				graphs: { select: { name: true } };
			};
		}>[];
		availableSandboxes: Prisma.SandboxGetPayload<{
			include: {
				owner: true;
				graphs: { select: { name: true } };
			};
		}>[];
		isDuplicateOpen?: boolean;
	};

	let { graph, availableCourses, availableSandboxes, isDuplicateOpen = $bindable() }: DuplicateGraphProps = $props();

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
		availableSandboxes.map((s) => ({
			id: s.id,
			type: 'SANDBOX',
			name: `${s.name} - ${displayName(s.owner)}`
		}))
	);

	let destinationCourses = $derived(
		availableCourses.map((c) => ({
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
			graphsInDestination = availableCourses.find((c) => c.id === destinationId)?.graphs;
		} else {
			graphsInDestination = availableSandboxes.find((s) => s.id === destinationId)?.graphs;
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
	<input
		type="text"
		name="destinationType"
		value={fromStore(formData).current.destinationType}
		hidden
	/>

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
						<Form.Label>Move to course / Sandbox</Form.Label>
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
						{#each destinationSandboxes as destination (destination.id)}
							<Command.Item
								value={sandbox.name}
								onSelect={() => {
									$formData.destinationId = destination.id;
									$formData.destinationType = 'SANDBOX';
									closeAndFocusTrigger(triggerId, () => (isDestinationCourseOpen = false));
								}}
							>
								{destination.name}
								<Check
									class={cn(
										'ml-auto',
										($formData.destinationType !== 'SANDBOX' ||
											$formData.destinationId !== destination.id) &&
											'text-transparent'
									)}
								/>
							</Command.Item>
						{/each}
					</Command.Group>

					<Command.Group heading="Courses">
						{#each destinationCourses as course (course.id)}
							<Command.Item
								value={course.name}
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

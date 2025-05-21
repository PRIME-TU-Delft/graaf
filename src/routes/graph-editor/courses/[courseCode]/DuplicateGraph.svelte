<script lang="ts">
	import { duplicateGraphSchema } from '$lib/zod/graphSchema';
	import { closeAndFocusTrigger, cn } from '$lib/utils';
	import { toast } from 'svelte-sonner';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { fromStore } from 'svelte/store';
	import { displayName } from '$lib/utils/displayUserName';
	import { fly } from 'svelte/transition';
	import { superForm } from 'sveltekit-superforms';
	import { useId } from 'bits-ui';
	import { page } from '$app/state';

	import type { Graph, Prisma } from '@prisma/client';

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

	let {
		graph,
		availableCourses,
		availableSandboxes,
		isDuplicateOpen = $bindable()
	}: {
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
		isDuplicateOpen: boolean;
	} = $props();

	const data = page.data;
	const triggerId = useId();
	const form = superForm(data.duplicateGraphForm, {
		id: 'duplicate-graph-' + graph.id,
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
	let availableDestinations = $derived.by(() => {
		const destinations: {
			id: number;
			name: string;
			owner: string | undefined;
			type: 'SANDBOX' | 'COURSE';
		}[] = availableSandboxes.map((s) => ({
			id: s.id,
			name: s.name,
			owner: displayName(s.owner),
			type: 'SANDBOX'
		}));

		return destinations.concat(
			availableCourses.map((c) => ({
				id: c.id,
				name: c.code + c.name,
				owner: undefined,
				type: 'COURSE'
			}))
		);
	});

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

	<Form.Field {form} name="newName">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label for="newName">Course name</Form.Label>
				<Input {...props} bind:value={$formData['newName']} />
			{/snippet}
		</Form.Control>
		<Form.Description />
		<Form.FieldErrors />
	</Form.Field>

	{@render selectDestination()}

	{#if graphHasSameNameAsOriginal}
		<p
			in:fly={{ y: -10, duration: 200, delay: 200 }}
			class="mt-2 rounded border-2 border-amber-900 bg-amber-50 p-2 text-sm text-amber-700"
		>
			Warning: The destination course already has a graph with the same name. This may cause
			confusion.
		</p>
	{/if}

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
			<Copy />
			Duplicate
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
						<Form.Label>Move to course</Form.Label>
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
					<Command.Input autofocus placeholder="Search course..." class="h-9" />
					<Command.Empty>No course found.</Command.Empty>
					<Command.Group>
						{#each availableDestinations as destination (destination.id + destination.type)}
							<Command.Item
								value={destination.type}
								onSelect={() => {
									$formData.destinationId = destination.id;
									$formData.destinationType = destination.type;
									closeAndFocusTrigger(triggerId, () => (isDestinationCourseOpen = false));
								}}
							>
								{destination.name}
								<!-- TODO something with destination.owner -->
								<Check
									class={cn(
										'ml-auto',
										(destination.type !== $formData.destinationType ||
											destination.id !== $formData.destinationId) &&
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

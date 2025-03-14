<script lang="ts">
	import { page } from '$app/state';
	import DialogButton from '$lib/components/DialogButton.svelte';
	import { buttonVariants } from '$lib/components/ui/button';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input';
	import * as Popover from '$lib/components/ui/popover';
	import { closeAndFocusTrigger, cn } from '$lib/utils';
	import { subjectSchema } from '$lib/zod/domainSubjectSchema';
	import type { Domain, Graph } from '@prisma/client';
	import { useId } from 'bits-ui';
	import Check from 'lucide-svelte/icons/check';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import type { PageData } from './$types';

	type Props = {
		graph: Graph & { domains: Domain[] };
	};

	const { graph }: Props = $props();

	const triggerId = useId();

	let dialogOpen = $state(false);
	let domainIdOpen = $state(false);

	const form = superForm((page.data as PageData).newSubjectForm, {
		validators: zodClient(subjectSchema),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('Subject created successfully!');
				dialogOpen = false;
			}
		}
	});

	const { form: formData, enhance } = form;
</script>

<DialogButton
	bind:open={dialogOpen}
	icon="plus"
	button="New Subject"
	title="Create Subject"
	description="A subject can be related to other subject."
>
	<!-- For sumbitting a NEW PROGRAM
 	It triggers an action that can be seen in +page.server.ts -->
	<form action="?/add-subject-to-graph" method="POST" use:enhance>
		<input type="hidden" name="graphId" value={graph.id} />

		<Form.Field {form} name="name">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label for="name">Subject name</Form.Label>
					<Input {...props} bind:value={$formData.name} />
				{/snippet}
			</Form.Control>
			<Form.Description>A common name for a subject</Form.Description>
			<Form.FieldErrors />
		</Form.Field>

		<Form.Field {form} name="domainId">
			<Popover.Root bind:open={domainIdOpen}>
				<Form.Control id={triggerId}>
					{#snippet children({ props })}
						<div class="mt-2 flex w-full items-center justify-between">
							<Form.Label>Link to domain (optional)</Form.Label>
							<Popover.Trigger
								class={cn(buttonVariants({ variant: 'outline' }), 'min-w-[50%] justify-between')}
								role="combobox"
								{...props}
							>
								{graph.domains.find((f) => f.id === $formData.domainId)?.name ?? 'Select domain'}
								<ChevronsUpDown class="opacity-50" />
							</Popover.Trigger>
							<input hidden value={$formData.domainId} name={props.name} />
						</div>
					{/snippet}
				</Form.Control>
				<Popover.Content>
					<Command.Root>
						<Command.Input autofocus placeholder="Search domain..." class="h-9" />
						<Command.Empty>No domain found.</Command.Empty>
						<Command.Group>
							{#each graph.domains as domain}
								<Command.Item
									value={domain.id.toString()}
									onSelect={() => {
										$formData.domainId = domain.id;
										closeAndFocusTrigger(triggerId, () => (domainIdOpen = false));
									}}
								>
									{domain.name}
									<Check
										class={cn('ml-auto', domain.id !== $formData.domainId && 'text-transparent')}
									/>
								</Command.Item>
							{/each}
						</Command.Group>
					</Command.Root>
				</Popover.Content>
			</Popover.Root>
		</Form.Field>

		<Form.Button class="float-right mt-4">Submit</Form.Button>
	</form>
</DialogButton>

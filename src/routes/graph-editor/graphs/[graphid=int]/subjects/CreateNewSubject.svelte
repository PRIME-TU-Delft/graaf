<script lang="ts">
	import { page } from '$app/state';
	import DialogButton from '$lib/components/DialogButton.svelte';
	import { buttonVariants } from '$lib/components/ui/button';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input';
	import * as Popover from '$lib/components/ui/popover';
	import { closeAndFocusTrigger, cn } from '$lib/utils';
	import { subjectSchema } from '$lib/zod/subjectSchema';
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
		id: 'create-subject-form-' + useId(),
		validators: zodClient(subjectSchema),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('Subject created successfully!');
				dialogOpen = false;
			}
		}
	});

	const { form: formData, enhance, submitting, delayed } = form;
</script>

<DialogButton
	bind:open={dialogOpen}
	icon="plus"
	button="New Subject"
	title="Create Subject"
	description="A subject is a topic or concept within a domain."
	class="sticky top-2 z-10 float-right -mt-14 h-9"
>
	<form action="?/add-subject-to-graph" method="POST" use:enhance>
		<input type="hidden" name="graphId" value={graph.id} />

		<Form.Field {form} name="name">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label for="name">Subject name</Form.Label>
					<Input {...props} bind:value={$formData.name} />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<Form.Field {form} name="domainId">
			<Popover.Root bind:open={domainIdOpen}>
				<Form.Control id={triggerId}>
					{#snippet children({ props })}
						<div class="mt-2 flex w-full items-center justify-between">
							<Form.Label>
								Link to domain
								<span class="font-mono text-xs font-normal text-gray-400">(Optional)</span>
							</Form.Label>
							<Popover.Trigger
								disabled={graph.domains.length === 0}
								class={cn(buttonVariants({ variant: 'outline' }), 'min-w-[50%] justify-between')}
								role="combobox"
								{...props}
							>
								{#if graph.domains.length === 0}
									No domains available
								{:else}
									{graph.domains.find((f) => f.id === $formData.domainId)?.name ?? 'Select domain'}
								{/if}
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
							{#each graph.domains as domain (domain.id)}
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

		<Form.Button disabled={$submitting} loading={$delayed} class="float-right mt-4">
			Create subject
		</Form.Button>
	</form>
</DialogButton>

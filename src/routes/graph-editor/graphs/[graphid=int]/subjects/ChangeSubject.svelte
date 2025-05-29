<script lang="ts">
	import { page } from '$app/state';
	import DialogButton from '$lib/components/DialogButton.svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input';
	import * as Menubar from '$lib/components/ui/menubar/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { closeAndFocusTrigger, cn } from '$lib/utils';
	import type { PrismaGraphPayload } from '$lib/validators/types';
	import { subjectSchema } from '$lib/zod/subjectSchema';
	import type { Subject } from '@prisma/client';
	import { useId } from 'bits-ui';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import type { PageData } from './$types';
	import DeleteSubject from './DeleteSubject.svelte';

	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import Check from 'lucide-svelte/icons/check';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
	import Ellipsis from 'lucide-svelte/icons/ellipsis';
	import Undo2 from 'lucide-svelte/icons/undo-2';

	type Props = {
		subject: PageData['graph']['subjects'][0];
		graph: PrismaGraphPayload;
	};

	let { subject, graph }: Props = $props();

	let changeSubjectDialog = $state(false);
	let domainIdOpen = $state(false);

	const triggerId = useId();
	const form = superForm((page.data as PageData).newSubjectForm, {
		id: 'change-subject-form-' + useId() + '-' + subject.id,
		validators: zodClient(subjectSchema),
		onResult: ({ result }) => {
			// Guard for not success
			if (result.type != 'success') return;

			changeSubjectDialog = false;

			toast.success('Subject changed successfully!');
		}
	});

	const { form: formData, enhance, tainted, isTainted, submitting, delayed } = form;

	$effect(() => {
		if (subject) {
			$formData.name = subject.name;
			$formData.domainId = subject.domainId ?? 0;

			// Set the form as untainted
			tainted.set({ name: false, domainId: false, graphId: false });
		}
	});
</script>

<Menubar.Root class="interactive ml-auto max-w-10 p-0">
	<Menubar.Menu value="menu">
		<Menubar.Trigger class="h-full w-full">
			<Ellipsis class="size-4 w-full" />
		</Menubar.Trigger>
		<Menubar.Content>
			<Menubar.Item class="p-0">
				<DialogButton
					button="Edit"
					title="Subject Settings"
					description="Edit the settings of the subject {subject.name}."
					bind:open={changeSubjectDialog}
					variant="outline"
					class="h-auto w-full justify-start rounded-sm border-0 px-2 py-1.5 hover:shadow-none"
				>
					{@render changeDomain()}
				</DialogButton>
			</Menubar.Item>

			<Menubar.Sub>
				<Menubar.SubTrigger class="font-bold text-red-700 hover:bg-red-100">
					Delete
				</Menubar.SubTrigger>
				<Menubar.SubContent>
					<DeleteSubject {subject} {graph} />
				</Menubar.SubContent>
			</Menubar.Sub>

			<Menubar.Separator />
			<Menubar.Item class="justify-between">
				<span>Highlight in preview</span>
				<ArrowRight class="size-4" />
			</Menubar.Item>
			<Menubar.Separator />

			{@render relations(subject.sourceSubjects, 'Sources')}
			{@render relations(subject.targetSubjects, 'Targets')}
		</Menubar.Content>
	</Menubar.Menu>
</Menubar.Root>

{#snippet relations(subjects: Subject[], title: 'Sources' | 'Targets')}
	{#if subjects.length > 0}
		<Menubar.Sub>
			<Menubar.SubTrigger>{title}</Menubar.SubTrigger>
			<Menubar.SubContent class="ml-1 w-32 p-1">
				{#each subjects as subject (subject.id)}
					<div class="flex flex-col items-center gap-1">
						<Button class="w-full font-mono text-xs" href="#subject-{subject.id}" variant="ghost">
							{subject.name}
						</Button>
					</div>
				{/each}
			</Menubar.SubContent>
		</Menubar.Sub>
	{:else}
		<Menubar.Item class="justify-between">
			<span>{title}</span>
			<span class="text-gray-400">None</span>
		</Menubar.Item>
	{/if}
{/snippet}

{#snippet changeDomain()}
	<form action="?/change-subject-in-graph" method="POST" use:enhance>
		<input type="hidden" name="graphId" value={graph.id} />
		<input type="hidden" name="subjectId" value={subject.id} />

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
								Link to Domain
								<span class="font-mono text-xs font-normal text-gray-400">(Optional)</span>
							</Form.Label>
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

		<div class="mt-4 flex justify-end gap-1">
			<Popover.Root>
				<Popover.Trigger class={cn(buttonVariants({ variant: 'destructive' }))}>
					Delete subject
				</Popover.Trigger>
				<Popover.Content>
					<DeleteSubject {subject} {graph} />
				</Popover.Content>
			</Popover.Root>

			<Button
				variant="outline"
				disabled={!isTainted($tainted)}
				onclick={() => {
					$formData.name = subject.name;
					$formData.domainId = subject.domainId ?? 0;

					tainted.set({ name: false, domainId: false, graphId: false });
				}}
			>
				<Undo2 /> Reset
			</Button>

			<Form.FormButton
				disabled={$submitting}
				loading={$delayed}
				loadingMessage="Changing subjects..."
			>
				Save
			</Form.FormButton>
		</div>
	</form>
{/snippet}

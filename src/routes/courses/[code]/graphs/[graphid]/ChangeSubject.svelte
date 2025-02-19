<script lang="ts">
	import { page } from '$app/state';
	import DialogButton from '$lib/components/DialogButton.svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input';
	import * as Menubar from '$lib/components/ui/menubar/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { cn } from '$lib/utils';
	import type { GraphType } from '$lib/validators/graphValidator';
	import { subjectSchema } from '$lib/zod/domainSubjectSchema';
	import type { Subject } from '@prisma/client';
	import { useId } from 'bits-ui';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import Ellipsis from 'lucide-svelte/icons/ellipsis';
	import Undo2 from 'lucide-svelte/icons/undo-2';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import type { PageData } from './$types';
	import DeleteSubject from './DeleteSubject.svelte';

	type Props = {
		subject: PageData['course']['graphs'][0]['subjects'][0];
		graph: GraphType;
	};

	let { subject, graph }: Props = $props();

	let changeSubjectDialog = $state(false);

	const form = superForm((page.data as PageData).newSubjectForm, {
		id: 'change-domain-form-' + useId(),
		validators: zodClient(subjectSchema),
		onResult: ({ result }) => {
			// Guard for not success
			if (result.type != 'success') return;

			toast.success('Domain changed successfully!');
		}
	});

	const { form: formData, enhance, tainted, isTainted } = form;

	$effect(() => {
		if (subject) {
			$formData.name = subject.name;

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
					title="Domain Relationship Settings"
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
				<Menubar.SubContent class="ml-1 w-32">
					<DeleteSubject {subject} {graph} />
				</Menubar.SubContent>
			</Menubar.Sub>

			<Menubar.Separator />
			<Menubar.Item class="justify-between">
				<span>Highlight in preview</span>
				<ArrowRight class="size-4" />
			</Menubar.Item>
			<Menubar.Separator />

			{@render relations(subject.incommingSubjects, 'In')}
			{@render relations(subject.outgoingSubjects, 'Out')}
		</Menubar.Content>
	</Menubar.Menu>
</Menubar.Root>

{#snippet relations(subjects: Subject[], title: 'In' | 'Out')}
	{#if subjects.length > 0}
		<Menubar.Sub>
			<Menubar.SubTrigger>{title} relations:</Menubar.SubTrigger>
			<Menubar.SubContent class="ml-1 w-32 p-1">
				{#each subjects as subject}
					<div class="flex flex-col items-center gap-1">
						<Button
							class="w-full font-mono text-xs"
							href="#{subject.id}-{subject.name}"
							variant="ghost"
						>
							{subject.name}
						</Button>
					</div>
				{/each}
			</Menubar.SubContent>
		</Menubar.Sub>
	{:else}
		<Menubar.Item class="justify-between">
			<span>{title} relations: </span>
			<span class="text-gray-400">None</span>
		</Menubar.Item>
	{/if}
{/snippet}

{#snippet changeDomain()}
	<form action="?/change-subject-in-graph" method="POST" use:enhance>
		<input type="hidden" name="graphId" value={graph.id} />
		<input type="hidden" name="domainId" value={subject.domain?.id} />
		<input type="hidden" name="subjectId" value={subject.id} />

		<Form.Field {form} name="name">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label for="name">Domain name</Form.Label>
					<Input {...props} bind:value={$formData.name} />
				{/snippet}
			</Form.Control>
			<Form.Description>
				A common name for the domain, i.e:
				<span class="font-mono text-xs">"Complex numbers"</span>
			</Form.Description>
			<Form.FieldErrors />
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
				}}
			>
				<Undo2 /> Reset
			</Button>
			<Form.Button>Change</Form.Button>
		</div>
	</form>
{/snippet}

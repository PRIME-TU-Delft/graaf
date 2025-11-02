<script lang="ts">
	import DialogButton from '$lib/components/DialogButton.svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Field from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input';
	import * as Menubar from '$lib/components/ui/menubar/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { cn } from '$lib/utils';
	import { fieldToIssueString } from '$lib/utils/issues';
	import type { PrismaGraphPayload } from '$lib/validators/types';
	import { Unlink } from '@lucide/svelte';
	import type { Subject } from '@prisma/client';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import { toast } from 'svelte-sonner';
	import { getGraph } from '../../graph.remote';
	import DeleteSubject from './DeleteSubject.svelte';
	import { changeSubject } from './subjects.remote';

	type Props = {
		subject: PrismaGraphPayload['subjects'][0];
		graph: PrismaGraphPayload;
	};

	let { subject, graph }: Props = $props();

	let changeSubjectMenu = $state<string | undefined>(undefined);
	let changeSubjectDialog = $state(false);
	let changeSubjectForm = $state<HTMLFormElement>();

	let subjectDomain = $state(String(subject.domain?.id ?? 0));
</script>

<Menubar.Root
	class="w-10 shrink-0 p-0"
	value={changeSubjectMenu}
	onValueChange={(value) => {
		changeSubjectMenu = value;
	}}
>
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
					{@render editSubjectSnippet()}
				</DialogButton>
			</Menubar.Item>

			<Menubar.Sub>
				<Menubar.SubTrigger class="font-bold text-red-700 hover:bg-red-100">
					Delete
				</Menubar.SubTrigger>
				<Menubar.SubContent>
					<DeleteSubject
						{subject}
						{graph}
						oncancel={() => {
							changeSubjectMenu = undefined;
						}}
					/>
				</Menubar.SubContent>
			</Menubar.Sub>

			<Menubar.Separator />
			<Menubar.Item class="justify-between" disabled>
				<span>Find in graph</span>
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

{#snippet editSubjectSnippet()}
	<form
		{...changeSubject.enhance(async ({ form, submit }) => {
			try {
				await submit().updates(getGraph(graph.id));
				if (changeSubject.fields.allIssues()?.length) return;

				form.reset();
				changeSubjectDialog = false;
				changeSubjectMenu = undefined;
				toast.success('Subject changed successfully!');
			} catch (e) {
				toast.error(JSON.stringify(e));
			}
		})}
		bind:this={changeSubjectForm}
	>
		<input hidden {...changeSubject.fields.graphId.as('number')} value={graph.id} />
		<input hidden {...changeSubject.fields.subjectId.as('number')} value={subject.id} />

		<Field.Field>
			<Field.Label for="name">Domain name</Field.Label>
			<Input {...changeSubject.fields.name.as('text')} value={subject.name} />
			<Field.Error>{fieldToIssueString(changeSubject.fields.name)}</Field.Error>
		</Field.Field>

		<Field.Field>
			<Field.Label for="subject-domain">Link to domain</Field.Label>
			<Select.Root type="single" bind:value={subjectDomain}>
				<input
					hidden
					{...changeSubject.fields.domainId.as('number')}
					value={Number(subjectDomain)}
				/>
				<Select.Trigger id="subject-domain">
					{graph.domains.find((domain) => domain.id === Number(subjectDomain))?.name ||
						'Select Domain'}
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="0">
						<Unlink />
						Detached
					</Select.Item>
					<hr />
					{#each graph.domains as domain (domain.id)}
						<Select.Item label={domain.name} value={String(domain.id)} />
					{/each}
				</Select.Content>
			</Select.Root>
			<Field.Error>
				{fieldToIssueString(changeSubject.fields.domainId)}
			</Field.Error>
		</Field.Field>

		<Field.Submit
			form={changeSubject}
			oncancel={() => {
				changeSubjectDialog = false;
				changeSubjectMenu = undefined;
				changeSubjectForm?.reset();
			}}
			submitTitle="Change Domain"
			loadingTitle="Changing Domain..."
		>
			{#snippet before()}
				<Popover.Root>
					<Popover.Trigger class={cn(buttonVariants({ variant: 'destructive' }))}>
						Delete domain
					</Popover.Trigger>
					<Popover.Content>
						<DeleteSubject
							{subject}
							{graph}
							oncancel={() => {
								changeSubjectMenu = undefined;
							}}
						/>
					</Popover.Content>
				</Popover.Root>
			{/snippet}
		</Field.Submit>
	</form>
{/snippet}

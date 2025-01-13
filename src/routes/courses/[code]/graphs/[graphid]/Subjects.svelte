<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table/index.js';
	import type { Subject } from '@prisma/client';
	import Ellipsis from 'lucide-svelte/icons/ellipsis';
	import Link from 'lucide-svelte/icons/link';
	import MoveVertical from 'lucide-svelte/icons/move-vertical';
	import { toast } from 'svelte-sonner';
	import { type Infer, type SuperValidated } from 'sveltekit-superforms';
	import type { PageData } from './$types';
	import CreateNewSubject from './CreateNewSubject.svelte';
	import CreateNewSubjectRel from './CreateNewSubjectRel.svelte';
	import SortableList from './SortableList.svelte';
	import type { subjectRelSchema, subjectSchema } from './zodSchema';

	type Props = {
		course: PageData['course'];
		tabValue: string;
		newSubjectForm: SuperValidated<Infer<typeof subjectSchema>>;
		newSubjectRelForm: SuperValidated<Infer<typeof subjectRelSchema>>;
	};

	let { course, tabValue = $bindable(), newSubjectForm, newSubjectRelForm }: Props = $props();

	const graph = $derived(course.graphs[0]);

	const subjectMapping = $derived.by(() => {
		const map: { subject: Subject; outSubject: Subject }[] = [];
		for (const subject of graph.subjects) {
			for (const outSubject of subject.outgoingSubjects) {
				map.push({ subject, outSubject });
			}
		}
		return map;
	});

	function handleRearrange<T>(list: T[]) {
		console.log($state.snapshot(list));
	}
</script>

<div class="mt-12 flex items-end justify-between">
	<h2 class="m-0">Subjects</h2>
	<CreateNewSubject {graph} form={newSubjectForm} />
</div>

<Table.Root class="mt-2">
	<Table.Header>
		<Table.Row>
			<Table.Head class="w-12"></Table.Head>
			<Table.Head>Name</Table.Head>
			<Table.Head class="flex items-center gap-1"><Link class="size-4" />Domain</Table.Head>
			<Table.Head># In</Table.Head>
			<Table.Head># Out</Table.Head>
			<Table.Head>Edit</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		<SortableList
			list={graph.subjects}
			onrearrange={(list) => handleRearrange(list)}
			useId={(subject) => `${subject.id}-${subject.name}`}
		>
			{#snippet children(subject)}
				<Table.Cell class="px-0">
					<Button variant="secondary" onclick={() => toast.warning('Not implemented')}>
						<MoveVertical />
					</Button>
				</Table.Cell>
				<Table.Cell>{subject.name}</Table.Cell>
				<Table.Cell>
					{#if subject.domain}
						<Button
							class="interactive"
							variant="outline"
							href="#{subject.domain!.id}-{subject.domain!.name}"
							onclick={() => {
								tabValue = 'Domains';
							}}
						>
							{subject.domain.name}
						</Button>
					{:else}
						<Button
							class="interactive"
							variant="outline"
							onclick={() => toast.warning('Not implemented')}
						>
							{'None'}
						</Button>
					{/if}
				</Table.Cell>
				<Table.Cell>{subject.incommingSubjects.length}</Table.Cell>
				<Table.Cell>{subject.incommingSubjects.length}</Table.Cell>
				<Table.Cell>
					<Button variant="outline" onclick={() => toast.warning('Not implemented')}>
						<Ellipsis />
					</Button>
				</Table.Cell>
			{/snippet}
		</SortableList>
	</Table.Body>
</Table.Root>

<div class="mt-12 flex items-end justify-between">
	<h2 class="m-0">Relationships</h2>
	<CreateNewSubjectRel {graph} form={newSubjectRelForm} />
</div>
<Table.Root class="mt-2">
	<Table.Header>
		<Table.Row>
			<Table.Head></Table.Head>
			<Table.Head>Name</Table.Head>
			<Table.Head>Linked to</Table.Head>
			<Table.Head class="text-right">Settings</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each subjectMapping as { subject, outSubject }, index (subject.id.toString() + outSubject.id.toString())}
			{@const id = `domain-rel-${subject.id}-${outSubject.id}`}
			<Table.Row
				{id}
				class={[
					'transition-colors delay-300',
					page.url.hash == `#${id}` ? 'bg-blue-200' : 'bg-blue-200/0'
				]}
			>
				<Table.Cell>
					{index + 1}
				</Table.Cell>
				<Table.Cell>
					<Button variant="secondary" href="#{subject.id}-{subject.name}">
						{subject.name}
					</Button>
				</Table.Cell>
				<Table.Cell>
					<Button variant="secondary" href="#{outSubject.id}-{outSubject.name}">
						{outSubject.name}
					</Button>
				</Table.Cell>
				<Table.Cell>
					<Button
						class="float-right"
						variant="outline"
						onclick={() => toast.warning('Not implemented', { description: 'includes: delete' })}
					>
						<Ellipsis />
					</Button>
				</Table.Cell>
			</Table.Row>
		{:else}
			<Table.Row>
				<Table.Cell colspan={2}>Create first subject relationship</Table.Cell>

				<Table.Cell colspan={2}>
					<CreateNewSubjectRel {graph} form={newSubjectRelForm} />
				</Table.Cell>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>

<div class="h-dvh"></div>

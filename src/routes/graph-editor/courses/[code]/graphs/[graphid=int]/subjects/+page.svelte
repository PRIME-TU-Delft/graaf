<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table/index.js';
	import type { Subject } from '@prisma/client';
	import Ellipsis from 'lucide-svelte/icons/ellipsis';
	import Link from 'lucide-svelte/icons/link';
	import MoveVertical from 'lucide-svelte/icons/move-vertical';
	import { toast } from 'svelte-sonner';
	import SortableList from '../SortableList.svelte';
	import type { PageData } from './$types';
	import ChangeSubject from './ChangeSubject.svelte';
	import CreateNewSubject from './CreateNewSubject.svelte';
	import CreateNewSubjectRel from './CreateNewSubjectRel.svelte';

	let { data }: { data: PageData } = $props();
	let course = $state(data.course);
	const graph = $derived(data.course.graphs[0]);

	const subjectMapping = $derived.by(() => {
		const map: { subject: Subject; outSubject: Subject }[] = [];
		for (const subject of graph.subjects) {
			for (const targetSubject of subject.targetSubjects) {
				map.push({ subject, outSubject: targetSubject });
			}
		}
		return map;
	});

	async function handleRearrange(newSubjectList: typeof graph.subjects) {
		let needRearrange = newSubjectList
			.filter((subject, index) => subject.order != index)
			.map((d, index) => {
				return {
					subjectId: d.id,
					oldOrder: d.order,
					newOrder: index
				};
			});

		const response = await fetch(`${graph.id}/subjects/reorder`, {
			method: 'PATCH',
			body: JSON.stringify(needRearrange),
			headers: { 'content-type': 'application/json' }
		});

		if (!response.ok) {
			toast.error('Failed to update subject color, try again later!');
			return;
		}

		course.graphs[0].subjects = newSubjectList;
	}
</script>

<div class="flex items-end justify-between">
	<h2 class="m-0">Subject</h2>
	<CreateNewSubject {graph} />
</div>

<Table.Root class="mt-2">
	<Table.Header>
		<Table.Row>
			<Table.Head class="w-12"></Table.Head>
			<Table.Head>Name</Table.Head>
			<Table.Head class="flex items-center gap-1"><Link class="size-4" />Domain</Table.Head>
			<Table.Head>Edit</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		<SortableList
			list={course.graphs[0].subjects}
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
							href="./domains#{subject.domain!.id}-{subject.domain!.name}"
						>
							{subject.domain.name}
						</Button>
					{:else}
						<Button
							class="interactive"
							variant="outline"
							onclick={() => toast.warning('Not implemented')}
						>
							None
						</Button>
					{/if}
				</Table.Cell>
				<Table.Cell>
					<ChangeSubject {subject} {graph} />
				</Table.Cell>
			{/snippet}
		</SortableList>
	</Table.Body>
</Table.Root>

<div class="mt-12 flex items-end justify-between">
	<h2 class="m-0">Relationships</h2>
	<CreateNewSubjectRel {graph} />
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
					<CreateNewSubjectRel {graph} />
				</Table.Cell>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>

<div class="h-dvh"></div>

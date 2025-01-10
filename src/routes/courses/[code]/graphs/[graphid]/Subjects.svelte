<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table/index.js';
	import Ellipsis from 'lucide-svelte/icons/ellipsis';
	import Link from 'lucide-svelte/icons/link';
	import MoveVertical from 'lucide-svelte/icons/move-vertical';
	import { toast } from 'svelte-sonner';
	import { type Infer, type SuperValidated } from 'sveltekit-superforms';
	import type { PageData } from './$types';
	import CreateNewSubject from './CreateNewSubject.svelte';
	import SortableList from './SortableList.svelte';
	import type { subjectSchema } from './zodSchema';
	import type { Domain } from '@prisma/client';

	type Props = {
		course: PageData['course'];
		tabValue: string;
		newSubjectForm: SuperValidated<Infer<typeof subjectSchema>>;
	};

	let { course, tabValue = $bindable(), newSubjectForm }: Props = $props();

	const graph = $derived(course.graphs[0]);

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

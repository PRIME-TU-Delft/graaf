<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table/index.js';
	import Ellipsis from 'lucide-svelte/icons/ellipsis';
	import Link from 'lucide-svelte/icons/link';
	import MoveVertical from 'lucide-svelte/icons/move-vertical';
	import { toast } from 'svelte-sonner';
	import type { PageData } from './$types';
	import CreateNewSubject from './CreateNewSubject.svelte';
	import SortableList from './SortableList.svelte';
	import type { subjectSchema } from './zodSchema';
	import { type Infer, type SuperValidated } from 'sveltekit-superforms';
	import { goto } from '$app/navigation';

	type Props = {
		course: PageData['course'];
		tabValue: string;
		newSubjectForm: SuperValidated<Infer<typeof subjectSchema>>;
	};

	let { course, tabValue = $bindable(), newSubjectForm }: Props = $props();

	const graph = $derived(course.graphs[0]);
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
		<SortableList list={graph.subjects} id="id">
			{#snippet sortItems(subject, index, onDragOver, onDragStart, onDragEnd)}
				<Table.Row
					id="{subject.id}-{subject.name}"
					class={[
						'transition-colors delay-300',
						page.url.hash == `#${subject.id}-${subject.name}` ? 'bg-blue-200' : 'bg-blue-200/0'
					]}
					data-index={index}
					ondragover={onDragOver}
					ondragstart={onDragStart}
					ondragend={onDragEnd}
					draggable="true"
				>
					<Table.Cell>
						<Button variant="secondary" onclick={() => toast.warning('Not implemented')}>
							<MoveVertical />
						</Button>
					</Table.Cell>
					<Table.Cell>{subject.name}</Table.Cell>
					<Table.Cell>
						{#if subject.domain}
							<Button
								variant="outline"
								href="#{subject.domain!.id}-{subject.domain!.name}"
								onclick={() => {
									tabValue = 'Domains';
								}}
							>
								{subject.domain.name}
							</Button>
						{:else}
							<Button variant="outline" onclick={() => toast.warning('Not implemented')}>
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
				</Table.Row>
			{/snippet}
		</SortableList>
	</Table.Body>
</Table.Root>

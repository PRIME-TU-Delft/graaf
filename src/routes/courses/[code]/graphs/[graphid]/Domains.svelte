<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as settings from '$lib/utils/settings';
	import Ellipsis from 'lucide-svelte/icons/ellipsis';
	import MoveVertical from 'lucide-svelte/icons/move-vertical';
	import { toast } from 'svelte-sonner';
	import type { Infer, SuperValidated } from 'sveltekit-superforms';
	import type { PageData } from './$types';
	import CreateNewDomain from './CreateNewDomain.svelte';
	import type { domainSchema } from './zodSchema';
	import SortableList from './SortableList.svelte';

	type Props = {
		course: PageData['course'];

		newDomainForm: SuperValidated<Infer<typeof domainSchema>>;
	};

	let { course, newDomainForm }: Props = $props();

	const graph = course.graphs[0];
</script>

<div class="mt-12 flex items-end justify-between">
	<h2 class="m-0">Domains</h2>
	<CreateNewDomain {graph} form={newDomainForm} />
</div>

<Table.Root class="mt-2">
	<Table.Header>
		<Table.Row>
			<Table.Head class="w-[100px]"></Table.Head>
			<Table.Head>Name</Table.Head>
			<Table.Head>Color</Table.Head>
			<Table.Head>Incomming</Table.Head>
			<Table.Head>Outgoing</Table.Head>
			<Table.Head class="text-right">Settings</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		<SortableList list={graph.domains} id="id">
			{#snippet sortItems(domain, index, onDragOver, onDragStart, onDragEnd)}
				<Table.Row
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
					<Table.Cell>{domain.name}</Table.Cell>
					<Table.Cell>
						{#if domain.style}
							<div
								class="h-5 w-5 rounded-full border-2 border-slate-600"
								style="background-color: {settings.COLORS[domain.style]}f0"
							></div>
						{:else}
							None
						{/if}
					</Table.Cell>
					<Table.Cell>{domain.incommingDomains.length}</Table.Cell>
					<Table.Cell>{domain.outgoingDomains.length}</Table.Cell>
					<Table.Cell>
						<Button
							variant="outline"
							class="float-right"
							onclick={() => toast.warning('Not implemented')}
						>
							<Ellipsis />
						</Button>
					</Table.Cell>
				</Table.Row>
			{/snippet}
		</SortableList>
	</Table.Body>
</Table.Root>

<h2>Relationships</h2>

<script lang="ts">
	import * as Table from '$lib/components/ui/table/index.js';
	import type { Infer, SuperValidated } from 'sveltekit-superforms';
	import type { PageData } from './$types';
	import CreateNewDomain from './CreateNewDomain.svelte';
	import type { domainSchema } from './zodSchema';

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
		{#each graph.domains as domain}
			<Table.Row>
				<Table.Cell></Table.Cell>
				<Table.Cell>{domain.name}</Table.Cell>
				<Table.Cell>{domain.style}</Table.Cell>
				<Table.Cell>{domain.incommingDomains.length}</Table.Cell>
				<Table.Cell>{domain.outgoingDomains.length}</Table.Cell>
				<Table.Cell>...</Table.Cell>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>

<h2>Relationships</h2>

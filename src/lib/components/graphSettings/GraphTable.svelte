<script lang="ts">
	// Components
	import * as Table from '$lib/components/ui/table/index.js';
	import GraphSettings from '$lib/components/graphSettings/GraphSettings.svelte';
	import CreateLink from '$lib/components/graphSettings/CreateLink.svelte';
	import DeleteLink from '$lib/components/graphSettings/DeleteLink.svelte';
	import EmbedLink from '$lib/components/graphSettings/EmbedLink.svelte';

	// Types
	import type { Prisma, Link } from '@prisma/client';
	import type { SuperValidated, Infer } from 'sveltekit-superforms';
	import type { graphSchemaWithId } from '$lib/zod/graphSchema';
	import type { editLinkSchema, newLinkSchema } from '$lib/zod/linkSchema';

	type GraphLinksProps = {
		graphs: Prisma.GraphGetPayload<{
			include: {
				lectures: true;
				links: true;
			};
		}>[];
		editGraphForm: SuperValidated<Infer<typeof graphSchemaWithId>>;
		newLinkForm: SuperValidated<Infer<typeof newLinkSchema>>;
		editLinkForm: SuperValidated<Infer<typeof editLinkSchema>>;
		getLinkURL: (link: Link) => string;
		hasAtLeastAdminPermission: boolean;
	};

	const {
		graphs,
		editGraphForm,
		newLinkForm,
		editLinkForm,
		getLinkURL,
		hasAtLeastAdminPermission
	}: GraphLinksProps = $props();
</script>

<div class="rounded-md border">
	<Table.Root class="!m-0">
		<Table.Header>
			<Table.Row>
				<Table.Head class="w-full">Name</Table.Head>
				<Table.Head>Actions</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each graphs as graph (graph.id)}
				<Table.Row class="p-0">
					<Table.Cell>
						{graph.name}
					</Table.Cell>
					<Table.Cell>
						<CreateLink {graph} {newLinkForm} />
						<GraphSettings {graph} {editGraphForm} canDelete={hasAtLeastAdminPermission} />
					</Table.Cell>
				</Table.Row>

				{#each graph.links as link (link.id)}
					<Table.Row class="bg-purple-50/50 odd:bg-purple-100/50 hover:bg-purple-100/30">
						<Table.Cell class="pl-8 text-xs">
							{getLinkURL(link)}
						</Table.Cell>
						<Table.Cell class="flex items-center justify-end gap-1">
							<EmbedLink {link} {getLinkURL} lectures={graph.lectures} />
							{#if hasAtLeastAdminPermission}
								<DeleteLink {graph} {link} {editLinkForm} />
							{/if}
						</Table.Cell>
					</Table.Row>
				{/each}
			{:else}
				<Table.Row>
					<Table.Cell colspan={2} class="text-center">No graphs found.</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</div>

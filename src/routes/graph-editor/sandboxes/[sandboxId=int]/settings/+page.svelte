<script lang="ts">
	import { hasSandboxPermissions } from '$lib/utils/permissions';

	// Components
	import EditSandbox from './EditSandbox.svelte';
	import DeleteSandbox from './DeleteSandbox.svelte';
	import GraphTable from '$lib/components/graphSettings/GraphTable.svelte';
	import EditorTable from './superUsers/EditorTable.svelte';
	import TransferOwnership from './TransferOwnership.svelte';

	// Icons
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<section
	class="prose top-20 z-10 mx-auto mb-4 flex w-full items-center justify-between rounded-lg bg-purple-50/80 p-4 shadow-none shadow-purple-200/70 backdrop-blur sm:sticky sm:border sm:border-purple-200 sm:shadow-lg"
>
	<h1 class="!m-0">{data.sandbox.name}</h1>
	<EditSandbox />
</section>

<section class="prose container mx-auto mt-8 p-4">
	<h2 class="m-0">Sandbox Editors</h2>

	<p>
		You can add other users as editors to this sandbox. They will be able to view, edit, and share
		all graphs in this sandbox. They cannot change its settings, or delete it.
	</p>

	<EditorTable sandbox={data.sandbox} />
</section>

<section class="prose mx-auto p-4">
	<h2>Graphs</h2>
	<p>
		Graphs are the bread and butter of the Graph Editor! They are perfect for structuring
		information, but since this is a sandbox, you can do whatever you want with them! Use <b
			>links</b
		>
		or <b>embeds</b> to share graphs with your friends.
	</p>

	<!-- TODO Placeholder for link URL -->
	<GraphTable
		graphs={data.sandbox.graphs}
		editGraphForm={data.editGraphForm}
		newLinkForm={data.newLinkForm}
		editLinkForm={data.editLinkForm}
		getLinkURL={(link) => `SANDBOX LINKS ARE NOT SUPPORTED YET`}
		hasAtLeastAdminPermission={hasSandboxPermissions(data.user, data.sandbox, 'Owner')}
	/>
</section>

<section
	id="danger-zone"
	class="prose mx-auto my-12 space-y-2 border-y-2 border-red-700/50 bg-red-100/50 p-4 text-red-900 shadow-red-900/70 sm:rounded-lg sm:border-2 sm:shadow"
>
	<h2 class="text-red-950">Danger zone</h2>
	<div class="flex items-center gap-2">
		<p class="!my-0">Transfer ownership</p>
		<div class="mx-2 flex-grow border-t-2 border-dotted border-red-400"></div>
		<TransferOwnership />
	</div>

	<div class="flex items-center gap-2">
		<p class="!my-0">Delete sandbox</p>
		<div class="mx-2 flex-grow border-t-2 border-dotted border-red-400"></div>
		<DeleteSandbox />
	</div>
</section>

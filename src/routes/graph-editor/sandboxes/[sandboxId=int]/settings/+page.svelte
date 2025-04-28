<script lang="ts">
	import DialogButton from '$lib/components/DialogButton.svelte';
	import EditSandbox from './EditSandbox.svelte';
	import DeleteSandbox from './DeleteSandbox.svelte';  
	import SandboxLinks from './links/SandboxLinks.svelte';
	/* import SandboxSuperUsers from './superUsers/SandboxSuperUsers.svelte';
	import TransferOwnership from './superUsers/TransferOwnership.svelte'; */

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let editSandboxDialogOpen = $state(false);
	let transferOwnershipDialogOpen = $state(false);

</script>

<section
	class="prose top-20 z-10 mx-auto mb-4 flex w-full items-center justify-between rounded-lg bg-purple-50/80 p-4 shadow-none shadow-purple-200/70 backdrop-blur sm:sticky sm:border sm:border-purple-200 sm:shadow-lg"
>
	<h1 class="m-0">{data.sandbox.name}</h1>

	<DialogButton
		bind:open={editSandboxDialogOpen}
		button="Edit sandbox name"
		icon="edit"
		title="Edit the name of this sandbox"
	>
		<EditSandbox
			sandbox={data.sandbox}
			onSuccess={() => {
				editSandboxDialogOpen = false;
			}}
		/>
	</DialogButton>
</section>

<!-- <SandboxSuperUsers sandbox={data.sandbox} user={data.user} /> -->
<SandboxLinks sandbox={data.sandbox} graphs={data.sandbox.graphs} />

<section
	id="danger-zone"
	class="prose mx-auto my-12 border-y-2 border-red-700/50 bg-red-100/50 p-4 text-red-900 shadow-red-900/70 sm:rounded-lg sm:border-2 sm:shadow"
>
	<h2 class="text-red-950">Danger zone</h2>
	<div class="flex items-center gap-2m my-2">
		<p class="my-0">Transfer ownership</p>
			<!-- <DialogButton
				bind:open={transferOwnershipDialogOpen}
				button="Transfer ownership"
				title="Transfer ownership of this sandbox to another user"
			>
			<TransferOwnership
				sandbox={data.sandbox}
				user={data.user}
				onSuccess={() => {
					transferOwnershipDialogOpen = false;
				}}
			/>
		</DialogButton> -->
	</div>

	<div class="flex items-center gap-2 my-2">
		<p class="my-0">Delete sandbox</p>
		<DeleteSandbox sandbox={data.sandbox} />
	</div>
</section>

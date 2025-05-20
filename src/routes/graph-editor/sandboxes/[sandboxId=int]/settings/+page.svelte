<script lang="ts">
	// Components
	import EditSandbox from './EditSandbox.svelte';
	import DeleteSandbox from './DeleteSandbox.svelte';
	import SandboxLinks from './links/SandboxLinks.svelte';
	import SandboxSuperUsers from './superUsers/SandboxEditors.svelte';
	import TransferOwnership from './TransferOwnership.svelte';

	// Icons
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<section
	class="prose top-20 z-10 mx-auto mb-4 flex w-full items-center justify-between rounded-lg bg-purple-50/80 p-4 shadow-none shadow-purple-200/70 backdrop-blur sm:sticky sm:border sm:border-purple-200 sm:shadow-lg"
>
	<h1 class="m-0">{data.sandbox.name}</h1>
	<EditSandbox />
</section>

<SandboxSuperUsers sandbox={data.sandbox} user={data.user} />
<SandboxLinks sandbox={data.sandbox} graphs={data.sandbox.graphs} />

<section
	id="danger-zone"
	class="prose mx-auto my-12 border-y-2 border-red-700/50 bg-red-100/50 p-4 text-red-900 shadow-red-900/70 sm:rounded-lg sm:border-2 sm:shadow"
>
	<h2 class="text-red-950">Danger zone</h2>
	<div class="my-2 flex items-center gap-2">
		<p class="my-0">Transfer ownership</p>
		<div class="mx-2 flex-grow border-t-2 border-dotted border-red-400"></div>
		<TransferOwnership />
	</div>

	<div class="my-2 flex items-center gap-2">
		<p class="my-0">Delete sandbox</p>
		<div class="mx-2 flex-grow border-t-2 border-dotted border-red-400"></div>
		<DeleteSandbox />
	</div>
</section>

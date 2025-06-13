<script lang="ts">

	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import NewSandboxButton from './newSandboxButton.svelte';
	import { displayName } from '$lib/utils/displayUserName';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

</script>

<section class="prose mx-auto mt-12 p-4">
	<div class="flex items-center justify-between mb-8">
		<h1 class="!m-0 text-purple-950 shadow-purple-500/70">Your Sandboxes</h1>
		<NewSandboxButton newSandboxForm={data.newSandboxForm} />
	</div>

	<div class="grid gap-2">
		{#each data.sandboxes as sandbox, i (sandbox.id)}
			<a
				href="./sandboxes/{sandbox.id}"
				class="flex items-center gap-2 rounded bg-purple-50 p-2 shadow-none no-underline shadow-purple-300 transition-all hover:bg-purple-100 hover:shadow-lg"
			>
				<span class="font-bold grow">{sandbox.name}</span>
				<span class="text-sm">{displayName(sandbox.owner)}</span>				
				<ArrowRight />
			</a>
		{/each}
	</div>
</section>
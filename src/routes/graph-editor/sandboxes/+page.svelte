<script lang="ts">
	import { displayName } from '$lib/utils/displayUserName';
	import { fly } from 'svelte/transition';

	// Components
	import Button from '$lib/components/ui/button/button.svelte';
	
	// Icons
	import ArrowRight from 'lucide-svelte/icons/arrow-right';

	// Types
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<section class="prose mx-auto mt-12 p-4 text-purple-900">
	<h1>Sandboxes</h1>
	<p>Here you can find all your sandboxes</p>

	<div class="grid gap-2">
		{#each data.sandboxes as sandbox, i (sandbox.id)}
			<div
				class="flex items-center justify-between rounded bg-purple-50 p-2 shadow-none shadow-purple-300 transition-all hover:bg-purple-100 hover:shadow-lg"
				transition:fly={{ x: -300, duration: 400, delay: 200 * i }}
			>
				<span>{sandbox.name}</span>
				<div class="flex items-center gap-2">
					<span>{displayName(sandbox.owner)}</span>

					<Button href="/graph-editor/sandboxes/{sandbox.id}" variant="secondary">
						View <ArrowRight />
					</Button>
				</div>
			</div>
		{/each}
	</div>
</section>

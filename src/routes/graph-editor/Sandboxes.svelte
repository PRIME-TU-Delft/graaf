<script lang="ts">
	// Components
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import SandboxGrid from './SandboxGrid.svelte';

	// Types
	import type { Sandbox, User } from '@prisma/client';

	type PinnedCoursesProps = {
		sandboxes: Promise<(Sandbox & { owner: User })[]>;
	};

	const { sandboxes }: PinnedCoursesProps = $props();
	let collapseSandboxes = $state('');
</script>

<section class="mx-auto !mt-3 max-w-4xl rounded-lg border-2 border-purple-200 bg-purple-50/50 p-2">
	<Accordion.Root type="single" class="w-full" bind:value={collapseSandboxes}>
		<Accordion.Item value="item">
			<Accordion.Trigger>
				<h2 class="w-full text-xl font-bold whitespace-nowrap text-purple-950">My Sandboxes</h2>
			</Accordion.Trigger>
			<Accordion.Content>
				{#await sandboxes}
					<p class="text-center text-purple-950">Waiting for sandboxes...</p>
				{:then sandboxes}
					<SandboxGrid {sandboxes} />
				{:catch error}
					<p class="text-center text-red-500">Error loading sandboxes: {error.message}</p>
				{/await}
			</Accordion.Content>
		</Accordion.Item>
	</Accordion.Root>
</section>

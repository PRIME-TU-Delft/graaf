<script lang="ts">

	// Components
	import { Button } from '$lib/components/ui/button';
	import SandboxGrid from './SandboxGrid.svelte';
	import NewSandboxButton from './newSandboxButton.svelte';

	// Icons
	import { ChevronDown, ChevronRight } from '@lucide/svelte';

	// Types
	import type { Sandbox, User } from '@prisma/client';

	type PinnedCoursesProps = {
		sandboxes: (Sandbox & { owner: User })[];
	};

	const { sandboxes }: PinnedCoursesProps = $props();
	let showPinnedCourses = $state(false);
</script>

{#if sandboxes && sandboxes.length > 0}
	<section class="mx-auto grid max-w-4xl gap-2 p-4">
		<div class="flex w-full items-center justify-between gap-4">
			<h2 class="whitespace-nowrap text-xl font-bold text-purple-950">My Sandboxes</h2>
			<div class="grow mx-2 border-t-2 border-purple-200"></div>

			{#if showPinnedCourses}
				<NewSandboxButton />
			{/if}

			<Button
				variant="link"
				class="p-0"
				onclick={() => {
					showPinnedCourses = !showPinnedCourses;
				}}
			>
				{#if showPinnedCourses}
					<ChevronDown /> Hide
				{:else}
					<ChevronRight /> Show
				{/if}
			</Button>
		</div>

		{#if showPinnedCourses}
			<SandboxGrid {sandboxes} />
		{/if}
	</section>
{/if}

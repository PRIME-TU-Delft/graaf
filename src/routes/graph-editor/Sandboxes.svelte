<script lang="ts">
	// Components
	import { Button } from '$lib/components/ui/button';
	import SandboxGrid from './SandboxGrid.svelte';

	// Icons
	import { ChevronDown, ChevronRight } from '@lucide/svelte';

	// Types
	import type { Sandbox, User } from '@prisma/client';

	type PinnedCoursesProps = {
		sandboxes: (Sandbox & { owner: User })[];
	};

	const { sandboxes }: PinnedCoursesProps = $props();
	let collapsePinnedCourses = $state(true);
</script>

<section
	class="mx-auto !mt-3 grid max-w-4xl gap-4 rounded-lg border-2 border-purple-200 bg-purple-50/50 p-4"
>
	<div class="flex w-full items-center justify-between gap-4">
		<h2 class="w-full text-xl font-bold whitespace-nowrap text-purple-950">My Sandboxes</h2>
		<Button
			variant="link"
			onclick={() => {
				collapsePinnedCourses = !collapsePinnedCourses;
			}}
		>
			{#if collapsePinnedCourses}
				<ChevronRight /> Show
			{:else}
				<ChevronDown /> Hide
			{/if}
		</Button>
	</div>

	{#if !collapsePinnedCourses}
		<SandboxGrid {sandboxes} />
	{/if}
</section>

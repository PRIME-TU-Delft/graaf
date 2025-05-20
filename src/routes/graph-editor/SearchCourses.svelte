<script lang="ts">
	import { goto } from '$app/navigation';
	import { fade } from 'svelte/transition';
	import type { Course } from '@prisma/client';

	// Components
	import { Button } from '$lib/components/ui/button';
	import * as Command from '$lib/components/ui/command/index.js';

	// Icons
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import Close from 'lucide-svelte/icons/circle-x';

	type Props = { courses: Course[] };
	const { courses }: Props = $props();

	let courseValue = $state('');
</script>

<Command.Root
	class="relative overflow-visible border-2 border-gray-200 focus-within:border-purple-500"
>
	<Command.Input
		class="h-9 !border-0 p-0 !shadow-none !outline-none !ring-0"
		placeholder="Search courses..."
		hasBorder={false}
		bind:value={courseValue}
	/>

	{#if courseValue}
		<div class="absolute right-1 top-1/2 h-fit w-fit -translate-y-1/2" in:fade>
			<Button
				onclick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					courseValue = '';
				}}
				class="size-8 p-0"
				variant="outline"
			>
				<Close class="size-3" />
			</Button>
		</div>
		<Command.List
			class="absolute left-0 top-12 max-h-96 w-full rounded-lg border-2 border-gray-200 bg-white shadow-lg"
		>
			{#each courses as course (course.id)}
				<Command.Item
					class="h-full w-full p-2"
					value={course.code + ' ' + course.name}
					onclick={() => goto(`/graph-editor/courses/${course.code}`)}
				>
					<p class="grow font-medium text-gray-900">
						{course.code} {course.name}
					</p>
					<ArrowRight class="" />
				</Command.Item>
			{/each}
		</Command.List>
	{/if}
</Command.Root>

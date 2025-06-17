<script lang="ts">
	import { cn } from '$lib/utils';
	import { fade } from 'svelte/transition';

	// Components
	import { Button } from '$lib/components/ui/button';

	// Icons
	import { Settings } from '@lucide/svelte';
	import PinUnpin from './PinUnpin.svelte';

	import type { Course, User } from '@prisma/client';

	type CourseGridProps = {
		user: User | undefined;
		courses: (Course & { pinnedBy: Pick<User, 'id'>[] })[];
		showArchivedCourses: boolean;
	};

	const { user, courses, showArchivedCourses }: CourseGridProps = $props();
</script>

<div
	class="grid max-h-96 grid-cols-1 gap-1 overflow-auto p-2 sm:grid-cols-2 md:grid-cols-2 md:gap-2"
>
	{#each courses as course (course.id)}
		{#if showArchivedCourses || !course.isArchived}
			{@render displayCourse(course)}
		{/if}
	{:else}
		<p class="col-span-full text-center text-gray-500">No courses found.</p>
	{/each}
</div>

{#snippet displayCourse(course: CourseGridProps['courses'][number])}
	<a
		href="/graph-editor/courses/{course.code}"
		class={cn([
			'flex w-full items-center justify-between gap-3 rounded border-2 border-transparent p-2 transition-colors hover:border-purple-200 hover:bg-purple-50/50',
			course.isArchived && 'border-dashed border-amber-600 bg-amber-50'
		])}
		in:fade={{ duration: 200 }}
	>
		<div class="flex gap-1">
			{course.code}
			{course.name}
		</div>

		<div class="mx-2 flex-grow border-t-2 border-dotted border-purple-200"></div>

		<div class="flex items-center gap-1">
			{#if course.isArchived}
				<Button variant="outline" href="/graph-editor/courses/{course.code}/settings">
					<Settings class="text-gray-600" />
				</Button>
			{/if}

			{#if user}
				<PinUnpin {course} {user} />
			{/if}
		</div>
	</a>
{/snippet}

<script lang="ts">
	import { cn } from '$lib/utils';
	import { enhance } from '$app/forms';
	import { fade } from 'svelte/transition';

	// Components
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';

	// Icons
	import { Archive } from '@lucide/svelte';
	import Pin from 'lucide-svelte/icons/pin';
	import Unpin from 'lucide-svelte/icons/pin-off';

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
		<p class="bg-purple-100/80 p-2 col-span-3 text-purple-900 rounded">
			This program has no courses yet.
		</p>
	{/each}
</div>

{#snippet displayCourse(course: CourseGridProps['courses'][number])}
	{@const pinned = course.pinnedBy.some((u) => u.id == user?.id)}

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
				<Button
					type="submit"
					variant="outline"
					class="h-8 w-8 border-purple-600 bg-purple-200"
					onclick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						goto(`/graph-editor/courses/${course.code}/settings#archive-course`);
					}}
				>
					<Archive class="text-purple-600" />
				</Button>
			{/if}

			<form action="?/change-course-pin" method="POST" use:enhance>
				<input type="text" name="courseId" value={course.id} hidden />
				<input type="text" name="pin" value={!pinned} hidden />
				<Button
					onclick={(e) => e.stopPropagation()}
					type="submit"
					variant="outline"
					class="h-8 w-8 border-purple-600 bg-purple-200"
				>
					{#if !pinned}
						<Pin class="text-purple-600" />
					{:else}
						<Unpin class="text-purple-600" />
					{/if}
				</Button>
			</form>
		</div>
	</a>
{/snippet}

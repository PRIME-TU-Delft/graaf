<script lang="ts">
	import { cn } from '$lib/utils';
	import { enhance } from '$app/forms';
	import { fade } from 'svelte/transition';
	import type { Course, User } from '@prisma/client';

	// Components
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';

	// Icons
	import { Archive } from '@lucide/svelte';
	import Pin from 'lucide-svelte/icons/pin';
	import Unpin from 'lucide-svelte/icons/pin-off';

	type CourseGridProps = {
		courses: (Course & { pinnedBy: Pick<User, 'id'>[] })[];
		user: User | undefined;
	};

	const { courses, user }: CourseGridProps = $props();
</script>

<div
	class="grid max-h-96 grid-cols-1 gap-1 overflow-auto p-2 sm:grid-cols-2 md:grid-cols-2 md:gap-2"
>
	{#each courses as course (course.id)}
		{@render displayCourse(course)}
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
			'flex w-full items-center justify-between rounded border-2 border-transparent bg-purple-100/50 p-2 transition-colors hover:border-purple-200 hover:bg-purple-100',
			course.isArchived && 'border-dashed border-amber-600 bg-amber-50'
		])}
		in:fade={{ duration: 200 }}
	>
		<div class="flex items-end gap-1">
			<p>{course.code}</p>
			<p>{course.name}</p>
		</div>

		<div class="flex items-center gap-1">
			{#if course.isArchived}
				<Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger
							onclick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								goto(`/graph-editor/courses/${course.code}/settings#archive-course`);
							}}
						>
							<Archive class="text-purple-900" />
							<Tooltip.Content
								side="right"
								class="border-2 border-amber-900 bg-amber-50 p-2 text-sm text-amber-700"
							>
								Course is archived
							</Tooltip.Content>
						</Tooltip.Trigger>
					</Tooltip.Root>
				</Tooltip.Provider>
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

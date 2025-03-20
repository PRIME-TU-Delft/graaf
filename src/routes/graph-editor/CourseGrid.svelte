<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { cn } from '$lib/utils';
	import { Archive } from '@lucide/svelte';
	import type { Course, User } from '@prisma/client';
	import Pin from 'lucide-svelte/icons/pin';
	import Unpin from 'lucide-svelte/icons/pin-off';
	import { fade } from 'svelte/transition';

	type CourseGridProps = {
		courses: (Course & { pinnedBy: Pick<User, 'id'>[] })[];
		user: User | undefined;
		showOnlyUnarchived: boolean;
	};

	const { courses, user, showOnlyUnarchived }: CourseGridProps = $props();
</script>

<div
	class="grid max-h-96 grid-cols-1 gap-1 overflow-auto p-2 sm:grid-cols-2 md:grid-cols-2 md:gap-2"
>
	{#each courses as course (course.code)}
		{@render displayCourse(course)}
	{:else}
		<p class="bg-white/80 p-2 col-span-3 text-slate-900/60 rounded">
			This program has no courses yet.
		</p>
	{/each}
</div>

{#snippet displayCourse(course: CourseGridProps['courses'][number])}
	{#if !(showOnlyUnarchived && course.isArchived)}
		<a
			href="graph-editor/courses/{course.code}"
			class={cn([
				'flex w-full items-center justify-between rounded border-2 bg-white/90 p-2 transition-colors hover:border-blue-200 hover:bg-blue-50',
				course.isArchived && 'border-dashed border-amber-600 bg-amber-50'
			])}
			in:fade={{ duration: 200 }}
		>
			<div class="flex items-center gap-1">
				{#if course.pinnedBy.some((u) => u.id == user?.id)}
					<form action="?/unpin-course" method="post" use:enhance>
						<input type="text" name="courseCode" value={course.code} hidden />
						<Button
							onclick={(e) => e.stopPropagation()}
							type="submit"
							variant="outline"
							class="h-8 w-8 border-blue-600 bg-blue-200"
						>
							<Unpin class="text-blue-600" />
						</Button>
					</form>
				{:else}
					<form action="?/pin-course" method="post" use:enhance>
						<input type="text" name="courseCode" value={course.code} hidden />
						<Button
							onclick={(e) => e.stopPropagation()}
							type="submit"
							variant="outline"
							class="h-8 w-8"
						>
							<Pin />
						</Button>
					</form>
				{/if}

				<p>{course.name}</p>
			</div>

			<div class="flex items-center gap-1">
				<p class="text-xs text-blue-900">{course.code}</p>

				{#if course.isArchived}
					<Tooltip.Provider>
						<Tooltip.Root>
							<Tooltip.Trigger>
								<Archive class="text-blue-900" />
								<Tooltip.Content
									side="right"
									class="border-2 border-amber-900 bg-amber-50 p-2 text-sm text-amber-700"
									>Course is archived</Tooltip.Content
								>
							</Tooltip.Trigger>
						</Tooltip.Root>
					</Tooltip.Provider>
				{/if}
			</div>
		</a>
	{/if}
{/snippet}

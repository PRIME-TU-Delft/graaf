<script lang="ts">

	// Components
	import CourseGrid from './CourseGrid.svelte';
	import { Button } from '$lib/components/ui/button';

	// Types
	import type { Course, User } from '@prisma/client';
	import { ChevronDown, ChevronRight } from '@lucide/svelte';

	type PinnedCoursesProps = {
		user: User;
		pinnedCourses: (Course & { pinnedBy: Pick<User, 'id'>[] })[];
	};

	const { user, pinnedCourses }: PinnedCoursesProps = $props();
	let showPinnedCourses = $state(false);
</script>

{#if pinnedCourses && pinnedCourses.length > 0}
	<section class="mx-auto grid max-w-4xl gap-4 p-4">
		<div class="flex w-full items-center justify-between gap-4">
			<h2 class="whitespace-nowrap text-xl font-bold text-purple-950">My Pinned Courses</h2>
			<div class="grow border-t-2 border-purple-200"></div>
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
			<CourseGrid {user} courses={pinnedCourses} />
		{/if}
	</section>
{/if}

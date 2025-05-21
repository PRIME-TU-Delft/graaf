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
		showArchivedCourses: boolean;
	};

	const { user, pinnedCourses, showArchivedCourses }: PinnedCoursesProps = $props();
	let collapsePinnedCourses = $state(false);
	let showPinnedCourses = $derived(
		pinnedCourses &&
			pinnedCourses.filter((course) => !course.isArchived || showArchivedCourses).length > 0
	);
</script>

{#if showPinnedCourses}
	<section
		class="mx-auto grid max-w-4xl gap-4 rounded-lg border-2 border-purple-200 bg-purple-50/50 p-4"
	>
		<div class="flex w-full items-center justify-between gap-4">
			<h2 class="text-xl font-bold whitespace-nowrap text-purple-950">My Pinned Courses</h2>
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
			<CourseGrid {user} {showArchivedCourses} courses={pinnedCourses} />
		{/if}
	</section>
{/if}

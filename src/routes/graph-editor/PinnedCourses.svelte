<script lang="ts">
	// Components
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import CourseGrid from './CourseGrid.svelte';

	// Types
	import type { Course, User } from '@prisma/client';

	type PinnedCoursesProps = {
		user: User;
		pinnedCourses: (Course & { pinnedBy: Pick<User, 'id'>[] })[];
		showArchivedCourses: boolean;
	};

	const { user, pinnedCourses, showArchivedCourses }: PinnedCoursesProps = $props();
	let collapsePinnedCourses = $state('');
	let showPinnedCourses = $derived(
		pinnedCourses &&
			pinnedCourses.filter((course) => !course.isArchived || showArchivedCourses).length > 0
	);
</script>

{#if showPinnedCourses}
	<section
		class="mx-auto !mt-3 max-w-4xl rounded-lg border-2 border-purple-200 bg-purple-50/50 p-2"
	>
		<Accordion.Root type="single" class="w-full" bind:value={collapsePinnedCourses}>
			<Accordion.Item value="item">
				<Accordion.Trigger open={collapsePinnedCourses == 'item'}>
					<h2 class="w-full text-xl font-bold whitespace-nowrap text-purple-950">
						My Pinned Courses
					</h2>
				</Accordion.Trigger>
				<Accordion.Content>
					<CourseGrid {user} {showArchivedCourses} courses={pinnedCourses} />
				</Accordion.Content>
			</Accordion.Item>
		</Accordion.Root>
	</section>
{/if}

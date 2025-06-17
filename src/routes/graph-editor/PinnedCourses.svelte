<script lang="ts">
	// Components
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import CourseGrid from './CourseGrid.svelte';

	// Types
	import type { Course, User } from '@prisma/client';

	type PinnedCoursesProps = {
		user: User;
		pinnedCourses: Promise<(Course & { pinnedBy: Pick<User, 'id'>[] })[]>;
		showArchivedCourses: boolean;
	};

	const { user, pinnedCourses, showArchivedCourses }: PinnedCoursesProps = $props();
	let collapsePinnedCourses = $state('');
</script>

<section class="mx-auto !mt-3 max-w-4xl rounded-lg border-2 border-purple-200 bg-purple-50/50 p-2">
	<Accordion.Root type="single" class="w-full" bind:value={collapsePinnedCourses}>
		<Accordion.Item value="item">
			<Accordion.Trigger>
				<h2 class="w-full text-xl font-bold whitespace-nowrap text-purple-950">
					My Pinned Courses
				</h2>
			</Accordion.Trigger>
			<Accordion.Content>
				{#await pinnedCourses}
					<p class="text-center text-purple-950">Waiting for pinned courses...</p>
				{:then pinnedCourses}
					{#if pinnedCourses.length === 0}
						<p class="text-center text-gray-500">No pinned courses found.</p>
					{:else}
						<CourseGrid {user} {showArchivedCourses} courses={pinnedCourses} />
					{/if}
				{:catch error}
					<p class="text-center text-red-500">Error loading pinned courses: {error.message}</p>
				{/await}
			</Accordion.Content>
		</Accordion.Item>
	</Accordion.Root>
</section>

<script lang="ts">
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<section class="prose mx-auto mt-12 p-4">
	<h1 class="text-purple-950 shadow-purple-500/70">All Courses</h1>

	<div class="grid gap-2">
		{#each data.courses as course (course.id)}
			<a
				href="./courses/{course.code}"
				class="flex items-center justify-between rounded bg-purple-50 p-2 no-underline shadow-none shadow-purple-300 transition-all hover:bg-purple-100 hover:shadow-lg"
			>
				<span>{course.code} {course.name}</span>
				<ArrowRight />
			</a>
		{/each}
	</div>
</section>

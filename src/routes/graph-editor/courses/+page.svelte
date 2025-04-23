<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import { fly } from 'svelte/transition';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<section class="prose mx-auto mt-12 p-4 text-purple-900">
	<h1>Courses</h1>
	<p>Here you can find all courses</p>

	<div class="grid gap-2">
		{#each data.courses as course, i (course.code)}
			<div
				class="flex items-center justify-between rounded bg-purple-50 p-2 shadow-none shadow-purple-300 transition-all hover:bg-purple-100 hover:shadow-lg"
				transition:fly={{ x: -300, duration: 400, delay: 200 * i }}
			>
				<span>{course.name}</span>
				<div class="flex items-center gap-2">
					<span>{course.code}</span>

					<Button href="/graph-editor/courses/{course.code}" variant="secondary">
						View <ArrowRight />
					</Button>
				</div>
			</div>
		{/each}
	</div>
</section>

<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<nav class="border-b-2 border-blue-300 bg-blue-200 p-4">
	<a href="/">Home</a>
	<a href="/courses">Courses</a>
</nav>

<section class="prose mx-auto p-4 text-blue-900">
	{#if data.error != undefined}
		<h1>Oops! Something went wrong</h1>
		<p>{data.error}</p>
	{:else}
		<h1 class="shadow-blue-500/70">{data.course.name}</h1>
		<p>
			Here you can find all Programs and associated Courses. Click on any of them to edit or view
			more information. You can also create a sandbox environment to experiment with the Graph
			Editor. Can't find a specific Program or Course? Maybe you don't have access to it. Contact
			one of its Admins to get access.
		</p>
	{/if}
</section>

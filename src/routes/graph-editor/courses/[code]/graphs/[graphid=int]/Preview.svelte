<script lang="ts">
	let { course } = $props();
</script>

<div class="sticky top-20 h-[75dvh] w-full rounded-xl bg-blue-200/50 p-4">
	<h2 class="m-0">Preview</h2>
	<pre class="h-3/4 overflow-auto">{JSON.stringify(course.graphs[0].domains, null, 2)}</pre>
</div>

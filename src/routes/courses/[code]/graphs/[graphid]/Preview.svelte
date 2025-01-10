<script lang="ts">
	import type { Course, Domain, Graph } from '@prisma/client';

	type Props = {
		data: Course & { graphs: (Graph & { domains: Domain[] })[] };
	};

	let { course } = $props();
</script>

<div class="sticky top-16 h-[75dvh] w-full rounded-xl bg-blue-200/50 p-4">
	<h2 class="m-0">Preview</h2>
</div>

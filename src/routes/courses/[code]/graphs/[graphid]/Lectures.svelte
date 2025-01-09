<script lang="ts">
	import type { PageData } from './$types';

	type Props = {
		course: PageData['course'];
	};

	const { course }: Props = $props();
</script>

<pre>
  {JSON.stringify(course.graphs[0].lectures, null, 2)}
</pre>

<script lang="ts">
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import '../app.css';

	let { children } = $props();
</script>

<Toaster />

<div class="p-4 lg:p-0">
	{@render children()}
</div>

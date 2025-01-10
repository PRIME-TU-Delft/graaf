<script lang="ts">
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { toast } from 'svelte-sonner';
	import '../app.css';

	let { data, children } = $props();

	$effect(() => {
		toast.promise(data.testConnection, {
			loading: 'Loading...',
			duration: Number.POSITIVE_INFINITY,
			error: 'Error',
			action: {
				label: 'Retry connection',
				onClick: () => {
					location.reload();
				}
			}
		});
	});
</script>

<Toaster closeButton />

{@render children()}

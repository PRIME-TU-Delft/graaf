<script lang="ts">
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { toast } from 'svelte-sonner';

	let { data, children } = $props();

	$effect(() => {
		toast.promise(data.testConnection, {
			loading: 'Loading...',
			duration: Number.POSITIVE_INFINITY,
			error: 'Error, could not connect to the database',
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

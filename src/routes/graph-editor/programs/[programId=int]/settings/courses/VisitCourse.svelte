<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';

	const { href }: { href: string } = $props();
</script>

<Button {href} variant="outline" class="float-right">
	Visit <ArrowRight />
</Button>

<script lang="ts">
	interface Props {
		above?: import('svelte').Snippet<[{ scrollTo: (target: 'nodes' | 'relations') => void }]>;
		below?: import('svelte').Snippet<[{ scrollTo: (target: 'nodes' | 'relations') => void }]>;
		children?: import('svelte').Snippet;
	}

	let { above, below, children }: Props = $props();

	function scrollTo(target: 'nodes' | 'relations') {
		if (target === 'nodes') {
			window.scrollTo(0, 0);
		} else {
			const header = document.getElementById('sticky-header');
			const divider = document.getElementById('scroll-divider');

			if (!header || !divider) {
				console.error('Sticky header or divider not found');
				return;
			}

			const header_rect = header.getBoundingClientRect();
			const divider_rect = divider.getBoundingClientRect();

			window.scrollBy(0, divider_rect.bottom - header_rect.height);
		}
	}

	// Functions
	function throttleEventCall(event: Event, callback: (event: Event) => void) {
		if (throttled) return;

		window.requestAnimationFrame(() => {
			callback(event);
			throttled = false;
		});

		throttled = true;
	}

	function onScroll(_: Event) {
		const header = document.getElementById('sticky-header');
		const divider = document.getElementById('scroll-divider');

		if (!header || !divider) {
			console.error('Header or divider not found');
			return;
		}

		const header_rect = header.getBoundingClientRect();
		const divider_rect = divider.getBoundingClientRect();

		above_scroll_boundry = divider_rect.bottom - divider_rect.height / 2 > header_rect.bottom;
	}

	// Initialization
	let above_scroll_boundry: boolean = $state(true);
	let throttled: boolean = false;
</script>

<!-- Markup -->

<svelte:document onscroll={(event) => throttleEventCall(event, onScroll)} />

<div class="tab-header">
	{#if above_scroll_boundry}
		{@render above?.({ scrollTo })}
	{:else}
		{@render below?.({ scrollTo })}
	{/if}

	{@render children?.()}
</div>

<!-- Styles -->

<style lang="sass">

	@import "./styles.sass"

</style>

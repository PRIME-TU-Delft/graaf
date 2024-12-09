
<script lang="ts">

	function scrollTo(target: 'nodes' | 'relations') {
		if (target === 'nodes') {
			window.scrollTo(0, 0)
		} else {
			const header = document.getElementById('sticky-header')
			const divider = document.getElementById('scroll-divider')

			if (!header || !divider) {
				console.error('Sticky header or divider not found')
				return
			}

			const header_rect = header.getBoundingClientRect()
			const divider_rect = divider.getBoundingClientRect()

			window.scrollBy(0, divider_rect.bottom - header_rect.height)
		}
	}

	// Functions
	function throttleEventCall(event: Event, callback: (event: Event) => void) {
		if (throttled) return

		window.requestAnimationFrame(() => {
			callback(event)
			throttled = false
		})

		throttled = true
	}

	function onScroll(_: Event) {
		const header = document.getElementById('sticky-header')
		const divider = document.getElementById('scroll-divider')

		if (!header || !divider) {
			console.error('Header or divider not found')
			return
		}

		const header_rect = header.getBoundingClientRect()
		const divider_rect = divider.getBoundingClientRect()

		above_scroll_boundry = divider_rect.bottom - divider_rect.height / 2 > header_rect.bottom
	}

	// Initialization
	let above_scroll_boundry: boolean = true
	let throttled: boolean = false

</script>

<!-- Markup -->

<svelte:document on:scroll={event => throttleEventCall(event, onScroll)} />

<div class="tab-header" >

	{#if above_scroll_boundry}
		<slot name="above" { scrollTo } />
	{:else}
		<slot name="below" { scrollTo } />
	{/if}

	<slot />

</div>

<!-- Styles -->

<style lang="sass">

	@import "./styles.sass"

</style>

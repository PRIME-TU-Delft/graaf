
<script lang="ts">

	// Internal dependencies
	import { graph, subject_query } from './stores'

	// Components
	import LinkButton from '$components/LinkButton.svelte'
	import Searchbar from '$components/Searchbar.svelte'
	import Button from '$components/Button.svelte'

	// Assets
	import sort_icon from '$assets/sort-icon.svg'

	// Functions
	function getScrollBoundry() {
		const sticky_header = document.getElementById('sticky-tabular-header')
		const divider = document.getElementById('relations')
		if (!sticky_header || !divider) return Infinity

		return divider.offsetTop - sticky_header.offsetHeight + divider.offsetHeight
	}

	function throttleEventCall(event: Event, callback: (event: Event) => void) {
		if (throttled) return

		window.requestAnimationFrame(() => {
			callback(event)
			throttled = false
		})

		throttled = true
	}
	
	function onScroll(_: Event) {
		above_scroll_boundry = window.scrollY < getScrollBoundry()	
	}

	function scrollTo(target: 'subjects' | 'relations') {
		if (target === 'subjects') {
			above_scroll_boundry = true
			window.scrollTo(0, 0)
		} else {
			const sticky_header = document.getElementById('sticky-tabular-header')
			const divider = document.getElementById('relations')
			if (!sticky_header || !divider) return Infinity

			const margin = parseInt(getComputedStyle(divider).marginTop, 10)

			above_scroll_boundry = false
			window.scrollTo(0, getScrollBoundry() + margin)
		}
	}

	// Initialization
	let above_scroll_boundry: boolean = true
	let throttled: boolean = false

</script>

<svelte:document on:scroll={event => throttleEventCall(event, onScroll)} />

<div class="tab-header" >

	{#if above_scroll_boundry}
		<h2> Subjects </h2>
		<LinkButton on:click={() => scrollTo('relations')}> Go to relations </LinkButton>
	{:else}
		<h2> Relations </h2>
		<LinkButton on:click={() => scrollTo('subjects')}> Go to subjects </LinkButton>
	{/if}

	<div class="flex-spacer" />

	<Searchbar placeholder="Search subjects and relations" bind:value={$subject_query} />
	<Button on:click={() => {
		$graph.sort()
		$graph = $graph
	}}> 
		<img src={sort_icon} alt=""> Sort by Domains
	</Button>

</div>

<style lang="sass">

	@import "./styles.sass"

</style>

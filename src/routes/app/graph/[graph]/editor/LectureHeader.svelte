
<script lang="ts">

	// Internal dependencies
	import { lecture_query } from './stores'

	// Components
	import Searchbar from '$components/Searchbar.svelte'

</script>

<div class="lecture-header" >
	<h2> Lectures </h2>

	<div class="flex-spacer" />

	<Searchbar placeholder="Search domains and relations" bind:value={$lecture_query} />
</div>

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.lecture-header
		display: flex
		flex-flow: row nowrap
		align-content: center
		gap: $form-small-gap

		padding: $card-thick-padding

</style>

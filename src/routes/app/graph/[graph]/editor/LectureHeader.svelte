
<script lang="ts">

	// Internal dependencies
	import { lecture_query } from './stores'

	// Components
	import Searchbar from '$components/Searchbar.svelte'

</script>

<!-- Markdown -->

<div class="tab-header" >
	<h2> Lectures </h2>

	<div class="flex-spacer" />

	<Searchbar placeholder="Search lectures" bind:value={$lecture_query} />
</div>

<!-- Styles -->

<style lang="sass">

	@import "./styles.sass"

</style>

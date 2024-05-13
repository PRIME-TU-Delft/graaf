
<script lang="ts">

	// Assets
	import search_icon from '$assets/search-icon.svg'

	// Exports
	export let placeholder: string = ''
	export let value: string = ''

</script>



<!-- Markup -->



<div class="searchbar">
	<input type="search" placeholder={placeholder} bind:value on:input on:change/>
	<img src={search_icon} alt="search-icon" />
</div>



<!-- Styles -->



<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.searchbar
		position: relative

		width: 100%
		max-width: 20rem

		input
			width: 100%
			padding: $input-thin-padding $input-thick-padding

			border: 1px solid $gray
			border-radius: $border-radius

			color: $dark-gray

			&:hover
				cursor: text

		img
			position: absolute
			translate: -50% -50%
			top: 50%
			right: 0

			width: $input-icon-size

			filter: $dark-gray-filter

</style>


<script lang="ts">

	// Assets
	import search_icon from '$assets/search-icon.svg'

	// Exports
	export let placeholder: string = ''
	export let value: string = ''

</script>


<!-- Markup -->


<div class="search">
	<input type="text" placeholder={placeholder} bind:value on:input on:change/>
	<img src={search_icon} alt="search-icon" />
</div>


<!-- Styles -->


<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.search
		position: relative

		width: 100%
		max-width: 20rem

		input
			width: 100%
			padding: 
				top: $input-thin-padding 
				right: $input-icon-size + 1.3rem
				bottom: $input-thin-padding
				left: $input-thick-padding

			border: 1px solid $gray
			border-radius: $border-radius

			color: $dark-gray
			background-color: $white

			&:focus
				border-color: $tudelft-blue

		img
			position: absolute
			translate: 0 -50%
			top: 50%
			right: 0.75rem

			width: $input-icon-size

			filter: $dark-gray-filter

</style>

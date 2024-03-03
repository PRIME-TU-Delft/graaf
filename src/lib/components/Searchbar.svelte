
<!-- Script -->

<script lang="ts">

	import search_icon from '$assets/search-icon.svg';

	export let onChange: (event: Event) => void = () => {};
	export let placeholder: string = "";

</script>

<!-- Markup -->

<div class="searchbar">
	<input type="search" placeholder={placeholder} on:change={onChange}/>
	<img src={search_icon} alt="search-icon" />
</div>

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass"

	.searchbar
		position: relative

		width: 100%
		max-width: 20rem

		input
			width: 100%
			padding: 0.375rem 0.75rem

			border: 1px solid variables.$gray
			border-radius: variables.$border-radius

			color: variables.$dark-gray
			transition: all 0.15s ease-in-out

			&:hover
				cursor: text

		img
			width: 1rem

			position: absolute
			top: 50%
			right: 0
			transform: translate(-50%, -50%)

</style>

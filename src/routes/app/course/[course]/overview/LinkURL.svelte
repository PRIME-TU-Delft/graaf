
<script lang="ts">

	// Assets
	import copy_icon from "$assets/copy-icon.svg"

	// Main
	export let url: string
	let copied: boolean = false

</script>

<!-- Markup -->

<div class="link-url">
	<input
		type="url"
		disabled={true}
		placeholder="Invalid link"
		bind:value={url}
	/>

	<button
		disabled={url === ''}
		on:click={async () => {
			copied = true
			await navigator.clipboard.writeText(url)
			setTimeout(() => copied = false, 2000)
		}}
	>
		<img src={copy_icon} alt="Copy link" />

		{#if copied}
			<span class="popup">
				Link copied!
			</span>
		{/if}
	</button>
</div>

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.link-url
		position: relative
		width: 100%

		input
			width: 100%
			padding:
				top: $input-thin-padding
				right: calc(2 * $input-thin-padding + $input-thick-padding + $input-icon-size)
				bottom: $input-thin-padding
				left: $input-thick-padding

			border: 1px solid $gray
			border-radius: $default-border-radius
			background: $light-gray
			color: $dark-gray
			
			cursor: text

		button
			position: absolute
			top: 0
			right: 0

			display: flex
			justify-content: center
			align-items: center

			height: 100%

			border: none
			border-radius: 0 $default-border-radius $default-border-radius 0
			background: $purple

			cursor: pointer
			transition: all $default-transition, outline 0s

			&:hover
				background-color: $dark-purple

			&:focus
				outline: $default-outline

			&:disabled
				background: $gray
				cursor: defaultS

			img
				width: $input-icon-size
				height: $input-icon-size
				margin: $input-thin-padding

				filter: $white-filter

				pointer-events: none

			.popup
				position: absolute
				bottom: calc(100% + 10px)
				z-index: 5

				width: max-content
				padding: 0 $input-thick-padding
				border-radius: $default-border-radius

				color: $white
				background: $dark-gray
				text-align: center

				pointer-events: none

				&::after
					position: absolute
					translate: -50% 50%
					rotate: 45deg
					bottom: 0
					left: 50%

					content: ""

					width: 0.5rem
					height: 0.5rem

					background: $dark-gray

</style>


<span class="list-row">
	<slot />
</span>

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.list-row
		align-content: center
		justify-content: center

		box-sizing: content-box
		height: $list-row-height
		padding: $input-thin-padding $input-thick-padding

		color: $dark-gray
		border-bottom: 1px solid $gray

		&:hover
			background: $light-gray

		&:first-of-type
			margin-top: -$input-thin-padding
			border-top-left-radius: $border-radius
			border-top-right-radius: $border-radius

		&:last-of-type
			border-bottom: none
			margin-bottom: -$input-thin-padding
			border-bottom-left-radius: $border-radius
			border-bottom-right-radius: $border-radius
</style>
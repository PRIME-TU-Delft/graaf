
<div class="list-row">
	<slot />
</div>

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.list-row
		dsplay: flex
		align-content: center
		justify-content: center

		height: $list-row-height
		padding: $input-thin-padding $input-thick-padding
		box-sizing: content-box

		color: $dark-gray
		border-bottom: 1px solid $gray

		&:hover
			background: $light-gray

		&:first-child
			margin-top: -$input-thin-padding
			border-top-left-radius: $border-radius
			border-top-right-radius: $border-radius

		&:last-child
			border-bottom: none
			margin-bottom: -$input-thin-padding
			border-bottom-left-radius: $border-radius
			border-bottom-right-radius: $border-radius
</style>
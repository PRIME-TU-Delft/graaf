
<script lang="ts">

	import success_icon from '$assets/success-icon.svg'
	import warning_icon from '$assets/warning-icon.svg'
	import error_icon from '$assets/error-icon.svg'

	export function setSaving(value: boolean) {
		saving = value

		if (value) {
			unsaved = false
			error = undefined
			if (timer) clearTimeout(timer)
			timer = setTimeout(() => timer = undefined, MIN_SAVE_TIME)
		}
	}

	export function setUnsaved() {
		error = undefined
		unsaved = true
	}

	export function setError(message: string) {
		error = message
		saving = false
		unsaved = true
	}

	const MIN_SAVE_TIME = 1000

	let timer: NodeJS.Timeout | undefined
	let error: string | undefined
	let unsaved = false
	let saving = false

</script>

<!-- Markdown -->

<div class="save-status">

	{#if error}

		<img src={ error_icon } alt="">
		{ error }

	{:else if saving || timer !== undefined}

		<span class="spinner" />
		Saving...

	{:else if unsaved}

		<img src={ warning_icon } alt="">
		Unsaved changes

	{:else}

		<img src={ success_icon } alt="">
		Saved
		
	{/if}

</div>

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	$spinner-size: 1rem
	$spinner-width: 1.5px

	.save-status
		display: flex
		flex-flow: row nowrap
		align-items: center
		gap: $form-small-gap

		width: max-content
		margin-bottom: $form-small-gap - 2rem
		color: $gray

		img
			width: $spinner-size
			height: $spinner-size

			filter: $gray-filter

		.spinner
			width: $spinner-size
			height: $spinner-size

			border-radius: 50%
			border: $spinner-width solid $gray
			border-top-color: transparent

			animation: spin 1s linear infinite

		@keyframes spin
			0%
				rotate: 0deg
			100%
				rotate: 360deg

</style>
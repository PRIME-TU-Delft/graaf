<script lang="ts">
	import success_icon from '$assets/success-icon.svg';
	import warning_icon from '$assets/warning-icon.svg';

	export function setSaving(value: boolean) {
		saving = value;

		if (value) {
			unsaved = false;
			if (timer) clearTimeout(timer);
			timer = setTimeout(() => (timer = undefined), MIN_SAVE_TIME);
		}
	}

	export function setUnsaved() {
		unsaved = true;
	}

	const MIN_SAVE_TIME = 1000;

	let timer = $state<ReturnType<typeof setTimeout>>();
	let unsaved = $state(false);
	let saving = $state(false);
</script>

<!-- Markdown -->

<div class="saving">
	{#if saving || timer !== undefined}
		<span class="spinner"></span>
		Saving...
	{:else if unsaved}
		<img src={warning_icon} alt="" />
		Unsaved changes
	{:else}
		<img src={success_icon} alt="" />
		Saved
	{/if}
</div>

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	$spinner-size: 1rem
	$spinner-width: 1.5px

	.saving
		display: flex
		flex-flow: row nowrap
		align-items: center
		gap: $form-small-gap

		width: max-content
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


<!-- Script -->

<script lang="ts">

	export let label: string;
	export let value: any = undefined;
	export let placeholder: string;
	export let options: { name: string, value: any }[];

	let show: boolean = false;

	$: id = label.toLowerCase().replace(/\s/g, "_");
	$: if (options.find(option => option.value === value) === undefined) {
		value = undefined; // If the current value isnt in the available options, default to undefined
	}

</script>

<!-- Markup -->

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-tabindex -->

<div class="dropdown" class:show on:click={() => show = !show && options.length > 0}>

	<!-- Hidden input to bind the selected value to a submittable element -->
	<input id={id} name={id} type="hidden" tabindex="-1" bind:value>
	<label for={id} class:placeholder={value === undefined}> {options.find(option => option.value === value)?.name ?? placeholder} </label>

	<div class="options">
		{#each options as option}
			<span on:click={() => value = option.value}> {option.name} </span>
		{/each}
	</div>
</div>

<!-- Styles -->

<style lang="sass">

	@use '$styles/variables.sass' as *
	@use '$styles/palette.sass' as *

	.dropdown
		display: flex
		flex-flow: column nowrap

		position: relative
		width: 100%

		color: $dark-gray

		label
			position: relative

			width: 100%
			padding: $input-thin-padding $input-thick-padding

			border: 1px solid $gray
			border-radius: $border-radius

			cursor: pointer

			&.placeholder
				color: $placeholder-color

			&::after
				content: ""

				position: absolute
				translate: 0 15%
				rotate: 45deg
				right: $input-thick-padding
				bottom: 50%

				box-sizing: border-box
				width: calc($input-icon-size / sqrt(2))
				height: calc($input-icon-size / sqrt(2))

				border: 1px solid $black
				border-width: 0 1px 1px 0

		.options
			display: none
			flex-flow: column nowrap

			position: absolute
			z-index: 1
			top: 100%

			width: 100%
			max-height: 250px
			overflow-y: auto

			background-color: $white
			border: 1px solid $gray
			border-width: 0 1px 1px 1px
			border-radius: 0 0 $border-radius $border-radius

			span
				padding: $input-thin-padding $input-thick-padding
				cursor: pointer

				&:last-child
					border-radius: 0 0 calc($border-radius - 1px) calc($border-radius - 1px)

				&:hover
					background-color: $light-gray

		&.show
			label
				border-bottom-style: dashed
				border-radius: $border-radius $border-radius 0 0

				&::after
					translate: 0 80%
					rotate: -135deg

			.options
				display: flex

</style>
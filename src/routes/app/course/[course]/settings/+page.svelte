
<script lang="ts">

	// Svelte imports
	import type { PageData } from './$types'

	// Components
	import Button from '$components/Button.svelte'
	import GeneralSettings from './GeneralSettings.svelte'
	import Layout from '$layouts/DefaultLayout.svelte'
	import Validation from '$components/Validation.svelte'
	import UserSettings from './UserSettings.svelte'

	// Assets
	import saveIcon from '$assets/save-icon.svg'

	// Exports
	export let data: PageData

	// Variables
	let { course } = data
	let active_tab: number = 0

	$: validation = course.validate()

	const shake = {
		keyframes: [
			{ transform: 'translate3d(0, 0, 0)'},
			{ transform: 'translate3d(-10px, 0, 0)'},
			{ transform: 'translate3d(8px, 0, 0)'},
			{ transform: 'translate3d(-6px, 0, 0)'},
			{ transform: 'translate3d(4px, 0, 0)'},
			{ transform: 'translate3d(-2px, 0, 0)'},
			{ transform: 'translate3d(0, 0, 0)'}
		],
		options: {
			duration: 400,
			easeing: 'cubic-bezier(.15,.5,.25,.95)',
		}
	}

	// Functions
	function goto_anchor(tab: number, id: string) {
		if (active_tab === tab) {
			const element = document.getElementById(id)
			element?.scrollIntoView({ behavior: 'smooth' })
			element?.animate(shake.keyframes, shake.options)
			return
		}

		active_tab = tab
		setTimeout(() => {
			const element = document.getElementById(id)
			element?.scrollIntoView({ behavior: 'smooth' })
			setTimeout(() => {element?.animate(shake.keyframes, shake.options)}, 150)
		}, 0)
	}

	function update() {

		/* Force Svelte update
		 * I hate this but svelte forces my hand
		 * Maybe I should just use a store or wait for Svelte 5
		 */

		course = course
	}

</script>


<!-- Markup -->


<Layout
	description="Here you can edit the layout of your graph. Drag and drop the nodes to change their position, and click on the nodes to edit their properties."
	path={[
		{
			name: 'Dashboard',
			href: '/app/dashboard'
		},
		{
			name: `${course.code} ${course.name}`,
			href: `/app/course/${course.code}/overview`
		},
		{
			name: 'Settings',
			href: `/app/course/${course.code}/settings`
		}
	]}
>
	<svelte:fragment slot="toolbar">
		<Validation data={validation} goto_anchor={goto_anchor} success="Ready to save" />
		<div class="flex-spacer" />
		<Button disabled={validation.severity === 'error'} on:click={() => course.save()}>
			<img src={saveIcon} alt=""> Save Changes
		</Button>
	</svelte:fragment>

	<div class="tabular">
		<div class="tabs">
			<button
				class="tab"
				class:active={active_tab === 0}
				on:click={() => active_tab = 0}
			> General </button>
			<button
				class="tab"
				class:active={active_tab === 1}
				on:click={() => active_tab = 1}
			> Assigned Users </button>

			<div class="dynamic-border" />
		</div>

		{#if active_tab === 0}
			<GeneralSettings {course} {update} />
		{:else if active_tab === 1}
			<UserSettings {course} {update} />
		{/if}
	</div>
</Layout>


<!-- Styles -->


<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.tabular
		border-radius: $border-radius
		border: 1px solid $gray

		.tabs
			display: flex
			overflow-x: scroll

			background: $light-gray
			border-radius: calc($border-radius - 1px) calc($border-radius - 1px) 0 0

			.tab
				padding: $card-thin-padding $card-thick-padding

				border-color: $gray
				border-style: solid
				border-width: 0 0 1px 1px
				border-radius: calc($border-radius - 1px) calc($border-radius - 1px) 0 0

				&.active
					background: $white
					border-width: 0 1px 0 1px

					& ~ .tab
						border-width: 0 1px 1px 0


				&:first-child
					border-left: none !important

			.dynamic-border
				border-bottom: 1px solid $gray
				flex: 1

</style>

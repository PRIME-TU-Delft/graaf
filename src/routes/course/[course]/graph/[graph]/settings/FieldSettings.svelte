
<script lang="ts">

	// Internal imports
	import { Graph, Domain, Subject } from '$scripts/entities'
	import { styles } from '$scripts/layout/settings'

	// Components
	import Button from '$components/Button.svelte'
	import Dropdown from '$components/Dropdown.svelte'
	import IconButton from '$components/IconButton.svelte'
	import LinkButton from '$components/LinkButton.svelte'
	import Searchbar from '$components/Searchbar.svelte'
	import Textfield from '$components/Textfield.svelte'

	// Assets
	import plusIcon from '$assets/plus-icon.svg'
	import trashIcon from '$assets/trash-icon.svg'
	import neutralSortIcon from '$assets/neutral-sort-icon.svg'
	import ascendingSortIcon from '$assets/ascending-sort-icon.svg'
	import descedingSortIcon from '$assets/descending-sort-icon.svg'

	// Exports
	export let graph: Graph

	// Variables
	let domainQuery: string = ''
	let subjectQuery: string = ''
	let domainIdSort: boolean | null = true
	let domainFromSort: boolean | null = null
	let domainToSort: boolean | null = null
	let subjectIdSort: boolean | null = true
	let subjectFromSort: boolean | null = null
	let subjectToSort: boolean | null = null

	$: styleOptions = Object.keys(styles).map(style => ({
		name: styles[style].display_name,
		value: style
	}))

	$: domainOptions = graph.domains
		.filter(domain => domain.name)
		.map(domain => ({
			name: domain.name!,
			value: domain
		}))

	// Force reactivity update
	function update() {
		graph = graph // Maybe redundant Svelte 5?
	}

	// Checks if query appears in domain
	function domainMatchesQuery(query: string, domain: Domain): boolean {
		query = query.toLowerCase()
		let name = domain.name?.toLowerCase()
		let style = domain._style ? styles[domain._style].display_name.toLowerCase() : undefined
		return name?.includes(query) || style?.includes(query) || false
	}

	// Checks if query appears in subject
	function subjectMatchesQuery(query: string, subject: Subject): boolean {
		query = query.toLowerCase()
		let name = subject.name?.toLowerCase()
		let domain = subject.domain?.name?.toLowerCase()
		return name?.includes(query) || domain?.includes(query) || false
	}
</script>



<!-- Markup -->



<!-- Domains -->
<div id="domains" class="editor">

	<!-- Toolbar -->
	<div class="toolbar">
		<h2>Domains</h2>
		<LinkButton href="#subjects">goto subjects</LinkButton>

		<div class="flex-spacer" />

		<Searchbar bind:value={domainQuery} />
		<Button on:click={() => { Domain.create(graph); update() }}>
			<img src={plusIcon} alt=""> Add Domain
		</Button>
	</div>

	<!-- If any domains were found that match the search -->
	{#if graph.domains.some(domain => domainMatchesQuery(domainQuery, domain))}

		<!-- Header -->
		<div class=row>

			<!-- ID sort button -->
			<IconButton
				src={domainIdSort === null ? neutralSortIcon : domainIdSort ? ascendingSortIcon : descedingSortIcon}
				on:click={() => {
					domainIdSort = !domainIdSort
					domainFromSort = domainToSort = null
					graph.domains.sort((a, b) => (a.id - b.id) * (domainIdSort ? 1 : -1))
					update()
				}}
			/>

			<!-- From label and sort button -->
			<div class="header" style="grid-area: left;">
				<span> From </span>
				<IconButton
					src={domainFromSort === null ? neutralSortIcon : domainFromSort ? ascendingSortIcon : descedingSortIcon}
					on:click={() => {
						domainFromSort = !domainFromSort
						domainIdSort = domainToSort = null
						graph.domains.sort((a, b) => {
							let astr = a.name || ''
							let bstr = b.name || ''
							return astr.localeCompare(bstr) * (domainFromSort ? 1 : -1)
						})

						update()
					}}
				/>
			</div>

			<!-- To label and sort button -->
			<div class="header" style="grid-area: right;">
				<span> To </span>
				<IconButton
					src={domainToSort === null ? neutralSortIcon : domainToSort ? ascendingSortIcon : descedingSortIcon}
					on:click={() => {
						domainToSort = !domainToSort
						domainIdSort = domainFromSort = null
						graph.domains.sort((a, b) => {
							let astr = a._style ? styles[a._style].display_name : ''
							let bstr = b._style ? styles[b._style].display_name : ''
							return astr.localeCompare(bstr) * (domainToSort ? 1 : -1)
						})

						update()
					}}
				/>
			</div>
		</div>

	{:else}

		<!-- If no domains were found that match the search -->
		<h6 class="empty"> No domains found </h6>

	{/if}

	<!-- Domain list -->
	{#each graph.domains as domain}
		{#if domainMatchesQuery(domainQuery, domain)}
			<div class="row">
				<span class="id"> {domain.id} </span>
				<IconButton scale src={trashIcon} on:click={() => { domain.delete(); update() }} />
				<Textfield label="Name" placeholder="Domain Name" bind:value={domain.name} />
				<Dropdown label="Style" placeholder="Domain Style" options={styleOptions} bind:value={domain._style}/>
				<span class="preview" style:background-color={domain.color()} />
			</div>
		{/if}
	{/each}
</div>

<!-- Subjects -->
<div id="subjects" class="editor">

	<!-- Toolbar -->
	<div class="toolbar">
		<h2>Subjects</h2>
		<LinkButton href="#domains">goto domains</LinkButton>

		<div class="flex-spacer" />

		<Searchbar bind:value={subjectQuery} />
		<Button on:click={() => { Subject.create(graph); update() }}>
			<img src={plusIcon} alt=""> Add Subject
		</Button>
	</div>

	<!-- If any subjects were found that match the search -->
	{#if graph.subjects.some(subject => subjectMatchesQuery(subjectQuery, subject))}

		<!-- Header -->
		<div class=row>

			<!-- ID sort button -->
			<IconButton
				src={subjectIdSort === null ? neutralSortIcon : subjectIdSort ? ascendingSortIcon : descedingSortIcon}
				on:click={() => {
					subjectIdSort = !subjectIdSort
					subjectFromSort = subjectToSort = null
					graph.subjects.sort((a, b) => { return (a.id - b.id) * (subjectIdSort ? 1 : -1)})
					update()
				}}
			/>

			<!-- From label and sort button -->
			<div class="header" style="grid-area: left;">
				<span> From </span>
				<IconButton
					src={subjectFromSort === null ? neutralSortIcon : subjectFromSort ? ascendingSortIcon : descedingSortIcon}
					on:click={() => {
						subjectFromSort = !subjectFromSort
						subjectIdSort = subjectToSort = null
						graph.subjects.sort((a, b) => {
							let astr = a.name || ''
							let bstr = b.name || ''
							return astr.localeCompare(bstr) * (subjectFromSort ? 1 : -1)
						})

						update()
					}}
				/>
			</div>

			<!-- To label and sort button -->
			<div class="header" style="grid-area: right;">
				<span> To </span>
				<IconButton
					src={subjectToSort === null ? neutralSortIcon : subjectToSort ? ascendingSortIcon : descedingSortIcon}
					on:click={() => {
						subjectToSort = !subjectToSort
						subjectIdSort = subjectFromSort = null
						graph.subjects.sort((a, b) => {
							let astr = a.domain?.name || ''
							let bstr = b.domain?.name || ''
							return astr.localeCompare(bstr) * (subjectToSort ? 1 : -1)
						})

						update()
					}}
				/>
			</div>
		</div>

	{:else}

		<!-- If no subjects were found that match the search -->
		<h6 class="empty"> No subjects found </h6>

	{/if}

	<!-- Subject list -->
	{#each graph.subjects as subject}
		{#if subjectMatchesQuery(subjectQuery, subject)}
			<div class="row">
				<span class="id"> {subject.id} </span>
				<IconButton scale src={trashIcon} on:click={() => { subject.delete(); update() }} />
				<Textfield label="Name" placeholder="Subject Name" bind:value={subject.name} />
				<Dropdown label="Domain" placeholder="Assigned Domain" options={domainOptions} bind:value={subject.domain} />
				<span class="preview" style:background-color={subject.color()} />
			</div>
		{/if}
	{/each}
</div>



<!-- Styles -->



<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	$icon-width: calc($input-icon-size + 2 * $input-icon-padding)

	.editor
		display: flex
		flex-flow: column nowrap
		padding: $card-thick-padding
		gap: $form-small-gap

		.toolbar
			display: flex
			flex-flow: row nowrap
			margin-bottom: $form-big-gap
			gap: $form-small-gap

		.empty
			margin: auto
			color: $gray

		.row
			display: grid
			grid-template: "id delete left right right-preview" auto / $icon-width $icon-width 1fr 1fr $icon-width
			place-items: center center
			gap: $form-small-gap
			width: 100%

			.header
				display: flex
				flex-flow: row nowrap
				align-content: center
				justify-content: right
				width: 100%

				span
					flex: 1

			:global(.icon-button)
				margin-bottom: 5px

			.preview
				width: $input-icon-size
				height: $input-icon-size

</style>

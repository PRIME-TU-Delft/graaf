
<script lang="ts">

	// Internal dependencies
	import { course } from './stores'
	import { LinkController } from '$scripts/controllers'

	// Components
	import LinkRow from './LinkRow.svelte'

	import Searchbar from '$components/Searchbar.svelte'
	import Button from '$components/Button.svelte'
	import Card from '$components/Card.svelte'

	// Assets
	import plus_icon from '$assets/plus-icon.svg'

    // Variables
	let link_query = ''

    $: filtered_links = $course.links.filter(link => link.matchesQuery(link_query))

</script>

<Card>
    <svelte:fragment slot="header">
        <h3 slot="header">Links</h3>
        <div class="flex-spacer" />
        <Searchbar placeholder="Search links" bind:value={link_query} />
        <Button on:click={async () => {
            await LinkController.create($course.cache, $course)
            $course = $course // Trigger reactivity
        }}>
            <img src={plus_icon} alt="" /> New Link
        </Button>
    </svelte:fragment>

    {#if filtered_links.length === 0}
        <p class="grayed"> There's nothing here </p>
    {:else}
        {#each filtered_links as link}
            <LinkRow {link} />
        {/each}
    {/if}
</Card>
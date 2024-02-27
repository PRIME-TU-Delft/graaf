
<!-- Script -->

<script lang="ts">

    import Row from "$components/forms/Row.svelte";

    export let label: string;
    export let default_value: boolean = false;

    let innerWidth: number;

</script>

<!-- Markup -->

<svelte:window bind:innerWidth />

{#if innerWidth > 600} <!-- NOTE this assumes $phone-width is 600px -->
    <Row>
        <div slot="right" class="grow">
            <input id={label} type="checkbox" value={default_value} />
            <label for={label}>{label}</label>
        </div>
    </Row>
{:else}
    <Row>
        <div slot="center" class="grow">
            <input id={label} type="checkbox" value={default_value} />
            <label for={label}>{label}</label>
        </div>
    </Row>
{/if}

<!-- Styles -->

<style lang="sass">
    
    @use "$styles/variables.sass"

    .grow
        width: 100%

    input
        accent-color: variables.$purple

        &:hover
            accent-color: variables.$dark-purple
            cursor: pointer
        
        @media screen and (max-width: variables.$phone-width)
            margin-right: 0.325rem
    
    label
        width: 100%

    

</style>

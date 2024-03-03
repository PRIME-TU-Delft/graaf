
<!-- Script -->

<script lang="ts">

    export let description: string = "Lorum ipsum dolor sid amed."; 
    export let path: Array<[string, string]> = [];

</script>

<!-- Markup -->

<div class="layout">
    <section class="header">
        <nav>
            {#each path as [name, href], index}
                <a href={href}>{name}</a>
                {#if index < path.length - 1} /&nbsp; {/if}
            {/each}
        </nav>
        
       {description}
    </section>

    {#if $$slots.toolbar}
        <section class="toolbar"><slot name="toolbar" /></section>
    {/if}
    
    <slot />
</div>

<!-- Styles -->

<style lang="sass">
    @use "$styles/variables.sass"

    .layout
        display: flex
        flex-flow: column nowrap
        align-items: stretch
        gap: 1rem

        width: 100%
        max-width: variables.$big-column

        .header
            margin-bottom: 1rem
            color: variables.$dark-gray

            nav
                margin-bottom: 0.5rem

                font-size: 1.75rem
                color: variables.$purple
                transition: all 0.15s ease-in-out

                a:hover
                    cursor: pointer
                    text-decoration: underline
                    color: variables.$dark-purple

        .toolbar
            display: flex
            flex-flow: row nowrap
            align-items: center
            gap: 0.5rem
</style>
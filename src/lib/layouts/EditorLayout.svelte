
<!-- Script -->

<script lang="ts">

    export let description: string = "Lorum ipsum dolor sid amed."; 
    export let path: Array<[string, string]> = [];

</script>

<!-- Markup -->

<div class="layout">
    <section class="header">
        <h2>
            {#each path as [name, href], index}
                <a href={href}>{name}</a>
                {#if index < path.length - 1} /&nbsp; {/if}
            {/each}
        </h2>
        
       {description}
    </section>

    {#if $$slots.toolbar}
        <section class="toolbar"><slot name="toolbar" /></section>
    {/if}
    
    <section class="body">
        <slot />
    </section>
</div>

<!-- Styles -->

<style lang="sass">

    @use "$styles/variables.sass" as *
    @use "$styles/palette.sass" as *

    .layout
        display: flex
        flex-flow: column nowrap

        width: 100%
        max-width: $big-column

        .header
            margin-bottom: $editorLayout-header-margin
            color: $dark-gray

            h2
                color: $purple
                transition: all $default-transition

                a:hover
                    cursor: pointer
                    color: $dark-purple
                    text-decoration: underline

        .toolbar
            display: flex
            flex-flow: row nowrap
            align-items: center
            gap: $layout-horizontal-gap

            margin-bottom: $editorLayout-toolbar-margin
        
        .body
            display: flex
            flex-flow: column nowrap
            gap: $layout-vertical-gap
        
</style>
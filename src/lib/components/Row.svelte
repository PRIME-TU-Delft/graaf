
<!-- Markup -->

<div class="row">
    <div><slot name="left"  /></div>
    <div><slot name="right" /></div>
</div>

<!-- Styles -->

<style lang="sass">
    
    @use "$styles/variables.sass"

    .row
        display: flex
        flex-flow: row nowrap
        align-items: center

        width: 100%
        margin-bottom: 1rem

        div
            &:first-child // Selects the first div
                flex: 2
            &:last-child // Selects the last div
                flex: 3

</style>


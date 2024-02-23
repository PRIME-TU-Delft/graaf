
<!-- Markup -->

<div class="card">
    <div class="header"><slot name="header" /></div>
    <div class="body"><slot name="body" /></div>
</div>

<!-- Styles -->

<style lang="sass">
    
    @use "$styles/variables.sass"

    .card
        display: flex
        flex-flow: column nowrap

        border-radius: 0.25rem
        border: 1px solid variables.$gray

        .header
            padding: 0.75rem 1.25rem

            background-color: variables.$light-gray
            border-radius: calc(.25rem - 1px) calc(.25rem - 1px) 0 0
            border-bottom: 1px solid variables.$gray

        .body
            padding: 1.25rem

</style>

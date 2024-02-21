
<!-- Script -->

<script lang="ts">

    export let header: string;

</script>

<!-- Markup -->

<div class="card">
    <div class="card-header">{header}</div>
    <div class="card-body">
        <slot />
    </div>
</div>

<!-- Styles -->

<style lang="sass">
    
    @use "$styles/variables.sass"

    .card
        border-radius: 0.25rem
        border: 1px solid rgba(0, 0, 0, .125)

        .card-header
            margin: 0
            padding: 0.75rem 1.25rem

            background-color: variables.$light-gray
            border-radius: calc(.25rem - 1px) calc(.25rem - 1px) 0 0
            border-bottom: 1px solid rgba(0, 0, 0, .125)

        .card-body
            padding: 1.25rem

</style>

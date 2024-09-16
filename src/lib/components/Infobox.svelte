
<script lang="ts">

    import infoIcon from '$assets/info-icon.svg'

</script>

<!-- Markdown -->


<div class="infobox">
    <div class="sidebar">
        <img src={infoIcon} alt="">
    </div>
    <div class="content">
        <slot />
    </div>
</div>


<!-- Styles -->


<style lang="sass">

    @use "$styles/variables.sass" as *
    @use "$styles/palette.sass" as *

    .infobox
        display: flex
        flex-flow: row nowrap

        margin: $card-thin-padding $card-thick-padding

        border: 1px solid $purple
        border-radius: $border-radius
        background-color: rgba($purple, 0.1)

        .sidebar
            display: flex
            align-items: center

            padding: $input-icon-padding
            background-color: $purple

            img
                width: 1.5rem
                height: 1.5rem
                filter: $white-filter
        
        .content
            padding: $card-thin-padding
            color: $dark-purple

</style>
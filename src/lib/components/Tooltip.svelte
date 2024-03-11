
<script lang="ts">

    export let data: string = "Lorum ipsum"
    let show: boolean = false
    let timeout: number
    
    function mouseEnter() {
        timeout = setTimeout(() => {
            show = true
        }, 1000)
    }

    function mouseLeave() {
        clearTimeout(timeout)
        show = false
    }

</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div on:mouseenter={mouseEnter} on:mouseleave={mouseLeave}>
    <span class:show={show}> {data} </span>
    <slot />
</div>

<style lang="sass">

    @use "$styles/variables.sass" as *
    @use "$styles/palette.sass" as *

    div
        display: flex
        align-items: center
        justify-content: center

        position: relative

        span
            position: absolute
            translate: -50% calc(-100% - $tooltip-spacing)
            z-index: 1
            left: 50%

            display: none
            width: auto
            max-width: $tooltip-width
            overflow-wrap: break-word

            padding: 0 $input-thick-padding
            border-radius: $border-radius

            content: "blah"
            color: $white
            background: $dark-gray
            text-align: center

            &.show
                display: inline-block

            &::after
                position: absolute
                translate: -50% 50%
                rotate: 45deg
                bottom: 0
                left: 50%

                content: ""

                width: 0.5rem
                height: 0.5rem

                background: $dark-gray

</style>
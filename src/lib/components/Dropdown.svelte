
<!-- Script -->

<script lang="ts">

    type Option = {
        name: string
        value: any
    }

    function toggle() {
        show = !show;
    }

    function choose(option: Option) {
        choice = option;
    }

    export let label: string;
    export let placeholder: string;
    export let options: Option[];

    let show: boolean = false;
    let choice: Option | null = null;

    $: id = label.toLowerCase().replace(/\s/g, "_");
    $: value = choice ? choice.value : choice;

</script>

<!-- Markup -->

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-tabindex -->

<div class="dropdown" class:show on:click={ toggle }>

    <!-- Hidden input to bind the selected value -->
    <input name={ id } type="hidden" value={ value }>
    <label for={ id } class:placeholder={ !choice }> 
        { choice ? choice.name : placeholder } 
    </label>
    
    <div class="options">
        {#each options as option}
            <span on:click={ () => choose(option) }> {option.name} </span>
        {/each}
    </div>
</div>

<!-- Styles -->

<style lang="sass">

    @use '$styles/variables.sass' as *
    @use '$styles/palette.sass' as *

    .dropdown
        display: flex
        flex-flow: column nowrap

        position: relative
        width: 100%

        color: $dark-gray

        label
            position: relative

            width: 100%
            padding: $input-thin-padding $input-thick-padding
            
            border: 1px solid $gray
            border-radius: $border-radius

            cursor: pointer

            &.placeholder
                color: $placeholder-color

            &::after
                content: ""

                position: absolute
                translate: 0 15%
                rotate: 45deg
                right: $input-thick-padding
                bottom: 50%

                box-sizing: border-box
                width: calc($input-icon-size / sqrt(2))
                height: calc($input-icon-size / sqrt(2))

                border: 1px solid $black
                border-width: 0 1px 1px 0
        
        .options
            display: none
            flex-flow: column nowrap

            position: absolute
            z-index: 1
            top: 100%

            width: 100%

            background-color: $white
            border: 1px solid $gray
            border-width: 0 1px 1px 1px
            border-radius: 0 0 $border-radius $border-radius

            span
                padding: $input-thin-padding $input-thick-padding
                cursor: pointer

                &:last-child
                   border-radius: 0 0 calc($border-radius - 1px) calc($border-radius - 1px)

                &:hover
                    background-color: $light-gray

        &.show
            label
                padding-bottom: calc( $input-thin-padding + 1px )
                border-width: 1px 1px 0 1px
                border-radius: $border-radius $border-radius 0 0

                &::after
                    translate: 0 80%
                    rotate: -135deg
            
            .options
                display: flex

</style>
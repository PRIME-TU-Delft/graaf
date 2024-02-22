
<!-- Markup -->

<div class="row">
    <div id="center"><slot name="center"/></div>
    <div id="left"><slot name="left"/></div>
    <div id="right"><slot name="right"/></div>
</div>

<!-- Styles -->

<style lang="sass">
    
    @use "$styles/variables.sass"

    .row
        display: flex
        flex-flow: row wrap
        align-items: center

        width: 100%
        margin-bottom: 1rem

        #center
            display: flex
            flex-flow: row nowrap
            justify-content: center

            flex: 1 1 100%
        
        #left
            flex: 2 1 40%           
        
        #right
            flex: 3 1 60%

</style>

